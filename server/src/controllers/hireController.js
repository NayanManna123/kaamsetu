import HireRequest from '../models/HireRequest.js';
import Notification from '../models/Notification.js';
import Job from '../models/Job.js';
import { ChatRoom, Message } from '../models/Chat.js';

/**
 * @desc    Send a hire request to a worker
 * @route   POST /api/hires
 * @access  Private (Company)
 *
 * Improvements:
 * - Richer notification payload via socket (includes job title, pay, company name)
 * - jobId now optional for "quick hire" scenarios
 * - Auto-uses job pay if offeredPay not specified
 */
export const sendHireRequest = async (req, res) => {
  try {
    const { workerId, jobId, message, offeredPay, startDate } = req.body;

    let job = null;
    if (jobId) {
      job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
    }

    const hireRequest = await HireRequest.create({
      company: req.user._id,
      worker: workerId,
      job: jobId || undefined,
      message: message || '',
      offeredPay: offeredPay || (job ? job.pay : 0),
      startDate,
    });

    const companyName = req.user.companyProfile?.companyName || req.user.name;
    const jobTitle = job ? job.title : 'Daily Work';
    const payAmount = hireRequest.offeredPay;

    // Create rich notification
    await Notification.create({
      user: workerId,
      type: 'hire_request',
      title: '📩 New Hire Request',
      message: `${companyName} wants to hire you for "${jobTitle}" — ₹${payAmount}/day`,
      data: {
        hireRequestId: hireRequest._id,
        jobId: jobId || null,
        companyName,
        jobTitle,
        offeredPay: payAmount,
        action: 'hire_request',
      },
    });

    // Emit rich socket notification for instant client rendering
    const io = req.app.get('io');
    if (io) {
      io.to(workerId.toString()).emit('notification', {
        type: 'hire_request',
        title: '📩 New Hire Request',
        message: `${companyName} wants to hire you for "${jobTitle}" — ₹${payAmount}/day`,
        data: {
          hireRequestId: hireRequest._id,
          jobId: jobId || null,
          companyName,
          jobTitle,
          offeredPay: payAmount,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hire request sent',
      data: hireRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Hire request already sent' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send bulk hire requests
 * @route   POST /api/hires/bulk
 * @access  Private (Company)
 *
 * Improvement: Emits socket notification to each worker
 */
export const bulkHire = async (req, res) => {
  try {
    const { workerIds, jobId, message, offeredPay } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const companyName = req.user.companyProfile?.companyName || req.user.name;
    const io = req.app.get('io');
    const results = [];

    for (const workerId of workerIds) {
      try {
        const hireRequest = await HireRequest.create({
          company: req.user._id,
          worker: workerId,
          job: jobId,
          message: message || '',
          offeredPay: offeredPay || job.pay,
        });
        results.push({ workerId, status: 'sent', hireRequestId: hireRequest._id });

        // Notify each worker with rich data
        const payAmount = offeredPay || job.pay;
        await Notification.create({
          user: workerId,
          type: 'hire_request',
          title: '📩 New Hire Request',
          message: `${companyName} wants to hire you for "${job.title}" — ₹${payAmount}/day`,
          data: {
            hireRequestId: hireRequest._id,
            jobId,
            companyName,
            jobTitle: job.title,
            offeredPay: payAmount,
          },
        });

        // Real-time socket emit
        if (io) {
          io.to(workerId.toString()).emit('notification', {
            type: 'hire_request',
            title: '📩 New Hire Request',
            message: `${companyName} wants to hire you for "${job.title}" — ₹${payAmount}/day`,
            data: { hireRequestId: hireRequest._id, jobId, offeredPay: payAmount },
          });
        }
      } catch (err) {
        results.push({ workerId, status: 'failed', error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Sent ${results.filter((r) => r.status === 'sent').length} hire requests`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get hire requests for current worker
 * @route   GET /api/hires/worker
 * @access  Private (Worker)
 */
export const getHireRequestsForWorker = async (req, res) => {
  try {
    const filter = { worker: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const requests = await HireRequest.find(filter)
      .populate('company', 'name companyProfile avatar rating')
      .populate('job', 'title pay payType workType location skills duration')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get hire requests sent by current company
 * @route   GET /api/hires/company
 * @access  Private (Company)
 */
export const getHireRequestsByCompany = async (req, res) => {
  try {
    const filter = { company: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const requests = await HireRequest.find(filter)
      .populate('worker', 'name workerProfile avatar rating phone location')
      .populate('job', 'title pay workType skills')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Respond to a hire request (accept/reject)
 * @route   PUT /api/hires/:id/respond
 * @access  Private (Worker)
 *
 * Improvements:
 * - On accept: auto-create chat room between company and worker
 * - Emit hire_accepted/hire_rejected socket events to company
 */
export const respondToHireRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "accepted" or "rejected"',
      });
    }

    const hireRequest = await HireRequest.findById(req.params.id).populate('job');
    if (!hireRequest) {
      return res.status(404).json({ success: false, message: 'Hire request not found' });
    }
    if (hireRequest.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    hireRequest.status = status;
    await hireRequest.save();

    const io = req.app.get('io');
    const jobTitle = hireRequest.job?.title || 'Daily Job';

    // If accepted, increment workersHired, hold escrow, and auto-create chat room
    if (status === 'accepted') {
      if (hireRequest.job) {
        await Job.findByIdAndUpdate(hireRequest.job._id, {
          $inc: { workersHired: 1 },
        });
      }

      // Escrow
      try {
        const Escrow = (await import('../models/Escrow.js')).default;
        await Escrow.create({
          job: hireRequest.job?._id,
          worker: hireRequest.worker,
          company: hireRequest.company,
          amount: hireRequest.offeredPay || hireRequest.job?.pay || 0,
          status: 'held',
        });
      } catch (e) {
        console.warn('Escrow creation skipped:', e.message);
      }

      // Auto-create chat room with job details message
      try {
        let room = await ChatRoom.findOne({
          participants: { $all: [hireRequest.company, hireRequest.worker] },
        });

        if (!room) {
          room = await ChatRoom.create({
            participants: [hireRequest.company, hireRequest.worker],
            job: hireRequest.job?._id,
          });
        }

        // Send system message with job details
        const jobDetails = hireRequest.job
          ? `📋 Job: ${hireRequest.job.title}\n💰 Pay: ₹${hireRequest.offeredPay || hireRequest.job.pay}/day\n📍 Location: ${hireRequest.job.location?.address || hireRequest.job.location?.city || 'TBD'}\n⏱ Duration: ${hireRequest.job.duration || '1 day'}`
          : `📋 Hire accepted — ₹${hireRequest.offeredPay}/day`;

        await Message.create({
          room: room._id,
          sender: hireRequest.worker,
          content: jobDetails,
        });

        await ChatRoom.findByIdAndUpdate(room._id, {
          lastMessage: {
            content: jobDetails,
            sender: hireRequest.worker,
            timestamp: new Date(),
          },
        });
      } catch (e) {
        console.warn('Auto chat room creation skipped:', e.message);
      }
    }

    // Notify company
    await Notification.create({
      user: hireRequest.company,
      type: 'hire_request',
      title: status === 'accepted' ? '✅ Hire Accepted' : '❌ Hire Declined',
      message: `${req.user.name} ${status} your hire request for "${jobTitle}"`,
      data: {
        hireRequestId: hireRequest._id,
        status,
        workerName: req.user.name,
        jobTitle,
      },
    });

    // Emit real-time events to company
    if (io) {
      io.to(hireRequest.company.toString()).emit('notification', {
        type: status === 'accepted' ? 'hire_accepted' : 'hire_rejected',
        title: status === 'accepted' ? '✅ Hire Accepted!' : '❌ Hire Declined',
        message: `${req.user.name} ${status} your hire request for "${jobTitle}"`,
        data: { hireRequestId: hireRequest._id, status },
      });
    }

    res.json({ success: true, message: `Hire request ${status}`, data: hireRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
