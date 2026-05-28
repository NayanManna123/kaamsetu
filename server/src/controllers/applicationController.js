import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import { calcDistance } from '../utils/helpers.js';
import { ChatRoom, Message } from '../models/Chat.js';

/**
 * @desc    Apply to a job
 * @route   POST /api/applications
 * @access  Private (Worker)
 */
export const applyToJob = async (req, res) => {
  try {
    const { jobId, message } = req.body;

    // Check job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Job is no longer open' });
    }

    // Check for duplicate application
    const existing = await Application.findOne({
      worker: req.user._id,
      job: jobId,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }

    // Auto-hiring evaluation for urgent jobs
    let isAutoAccepted = false;
    if (job.urgency === 'urgent') {
      let matchScore = 0;
      // 1. Skill overlap (45 pts)
      if (job.skills && req.user.workerProfile?.skills) {
        const overlap = req.user.workerProfile.skills.filter((s) =>
          job.skills.includes(s)
        ).length;
        matchScore += (overlap / Math.max(job.skills.length, 1)) * 45;
      }
      // 2. Distance check (25 pts)
      if (
        job.location &&
        job.location.coordinates[0] !== 0 &&
        req.user.location &&
        req.user.location.coordinates[0] !== 0
      ) {
        const distance = calcDistance(job.location.coordinates, req.user.location.coordinates);
        if (distance < 5) matchScore += 25;
        else if (distance < 15) matchScore += 15;
      }
      // 3. Availability check (15 pts)
      if (req.user.workerProfile?.isInstantAvailable || req.user.workerProfile?.availability === 'today') {
        matchScore += 15;
      }
      // 4. Rating (15 pts)
      matchScore += (req.user.rating / 5) * 7.5;
      matchScore += ((req.user.workerProfile?.reliabilityScore || 100) / 100) * 7.5;

      if (matchScore >= 75) { // 75%+ match on urgent job triggers auto-hire
        isAutoAccepted = true;
      }
    }

    const application = await Application.create({
      worker: req.user._id,
      job: jobId,
      message: message || '',
      status: isAutoAccepted ? 'accepted' : 'pending',
    });

    if (isAutoAccepted) {
      // Increment workers hired
      job.workersHired = (job.workersHired || 0) + 1;
      if (job.workersHired >= job.workersNeeded) {
        job.status = 'in_progress';
      }
      await job.save();

      // Hold Escrow
      const Escrow = (await import('../models/Escrow.js')).default;
      await Escrow.create({
        job: job._id,
        worker: req.user._id,
        company: job.company,
        amount: job.pay,
        status: 'held',
      });

      // Notify company
      await Notification.create({
        user: job.company,
        type: 'job_application',
        title: '⚡ Instant Auto-Hire Complete',
        message: `${req.user.name} was auto-hired for your urgent job "${job.title}" due to a high match score!`,
        data: { applicationId: application._id, jobId: job._id },
      });

      // Notify worker
      await Notification.create({
        user: req.user._id,
        type: 'application_status',
        title: '🎉 Auto-Hired Instantly!',
        message: `You have been instantly hired for urgent job "${job.title}"!`,
        data: { applicationId: application._id, jobId: job._id },
      });

      const io = req.app.get('io');
      if (io) {
        io.to(job.company.toString()).emit('notification', {
          type: 'job_application',
          message: `Worker auto-hired for "${job.title}"!`,
        });
        io.to(req.user._id.toString()).emit('notification', {
          type: 'application_status',
          message: `Auto-hired for "${job.title}"!`,
        });
      }
    } else {
      // Increment application count on job
      await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

      // Notify company
      await Notification.create({
        user: job.company,
        type: 'job_application',
        title: 'New Application',
        message: `${req.user.name} applied for "${job.title}"`,
        data: { applicationId: application._id, jobId: job._id },
      });

      const io = req.app.get('io');
      if (io) {
        io.to(job.company.toString()).emit('notification', {
          type: 'job_application',
          message: `New application for "${job.title}"`,
        });
      }
    }
    
    // Auto-create chat room between Worker (req.user) and Job owner (job.company)
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [req.user._id, job.company] },
      job: jobId,
    });
    if (!chatRoom) {
      const msgContent = isAutoAccepted 
        ? `🎉 I have been auto-hired for your job: "${job.title}"! Let's connect.` 
        : `👋 I have applied for the job: "${job.title}". Let's chat!`;

      chatRoom = await ChatRoom.create({
        participants: [req.user._id, job.company],
        job: jobId,
        lastMessage: {
          content: msgContent,
          sender: req.user._id,
          timestamp: new Date(),
        },
      });

      // Create initial message
      await Message.create({
        room: chatRoom._id,
        sender: req.user._id,
        content: msgContent,
      });
    }

    res.status(201).json({
      success: true,
      message: isAutoAccepted ? 'Auto-hired instantly!' : 'Application submitted',
      data: application,
      chatRoomId: chatRoom._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already applied' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get applications for a specific job
 * @route   GET /api/applications/job/:jobId
 * @access  Private (Company owner)
 */
export const getApplicationsForJob = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('worker', 'name avatar phone workerProfile rating location')
      .sort({ appliedAt: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current worker's applications
 * @route   GET /api/applications/my
 * @access  Private (Worker)
 */
export const getMyApplications = async (req, res) => {
  try {
    const filter = { worker: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const applications = await Application.find(filter)
      .populate({
        path: 'job',
        populate: { path: 'company', select: 'name companyProfile avatar' },
      })
      .sort({ appliedAt: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update application status (accept/reject)
 * @route   PUT /api/applications/:id/status
 * @access  Private (Company)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "accepted" or "rejected"',
      });
    }

    const application = await Application.findById(req.params.id).populate('job');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // If accepted, increment workersHired on the job and hold escrow funds
    if (status === 'accepted') {
      await Job.findByIdAndUpdate(application.job._id, {
        $inc: { workersHired: 1 },
      });
      const Escrow = (await import('../models/Escrow.js')).default;
      await Escrow.create({
        job: application.job._id,
        worker: application.worker,
        company: application.job.company,
        amount: application.job.pay,
        status: 'held',
      });
    }

    // Notify worker
    await Notification.create({
      user: application.worker,
      type: 'application_status',
      title: status === 'accepted' ? '🎉 Application Accepted!' : 'Application Update',
      message:
        status === 'accepted'
          ? `Your application for "${application.job.title}" has been accepted!`
          : `Your application for "${application.job.title}" was not selected.`,
      data: { applicationId: application._id, jobId: application.job._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(application.worker.toString()).emit('notification', {
        type: 'application_status',
        status,
      });
    }

    res.json({ success: true, message: `Application ${status}`, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
