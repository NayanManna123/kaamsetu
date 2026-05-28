import Attendance from '../models/Attendance.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import HireRequest from '../models/HireRequest.js';
import Notification from '../models/Notification.js';
import { calcDistance } from '../utils/helpers.js';

/**
 * @desc    Check-in to a job
 * @route   POST /api/attendance/check-in
 * @access  Private (Worker)
 */
export const checkIn = async (req, res) => {
  try {
    const { jobId, coordinates } = req.body; // coordinates is [lng, lat]

    if (!jobId || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: 'Job ID and coordinates are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify worker is hired for this job
    const appHired = await Application.findOne({ worker: req.user._id, job: jobId, status: 'accepted' });
    const hireHired = await HireRequest.findOne({ worker: req.user._id, job: jobId, status: 'accepted' });

    if (!appHired && !hireHired) {
      return res.status(403).json({ success: false, message: 'You are not hired for this job' });
    }

    // Check if already checked in
    const activeAttendance = await Attendance.findOne({
      worker: req.user._id,
      job: jobId,
      status: 'checked_in',
    });
    if (activeAttendance) {
      return res.status(400).json({ success: false, message: 'Already checked in for this job' });
    }

    // Proximity check (300m threshold)
    if (job.location && job.location.coordinates[0] !== 0) {
      const distance = calcDistance(coordinates, job.location.coordinates) * 1000; // in meters
      if (distance > 300) {
        return res.status(400).json({
          success: false,
          message: `You must be at the job site to check in. You are ${Math.round(distance)}m away (max limit: 300m).`,
        });
      }
    }

    const attendance = await Attendance.create({
      worker: req.user._id,
      job: jobId,
      checkInLocation: { type: 'Point', coordinates },
      status: 'checked_in',
    });

    // Notify company
    await Notification.create({
      user: job.company,
      type: 'attendance_checkin',
      title: '👷 Worker Checked In',
      message: `${req.user.name} has checked in at the job site for "${job.title}"`,
      data: { jobId, attendanceId: attendance._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(job.company.toString()).emit('notification', {
        type: 'attendance_checkin',
        message: `${req.user.name} checked in!`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Check-out from a job
 * @route   POST /api/attendance/check-out
 * @access  Private (Worker)
 */
export const checkOut = async (req, res) => {
  try {
    const { jobId, coordinates } = req.body;

    if (!jobId || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: 'Job ID and coordinates are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const attendance = await Attendance.findOne({
      worker: req.user._id,
      job: jobId,
      status: 'checked_in',
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No active check-in found for this job' });
    }

    // Proximity check (300m threshold)
    if (job.location && job.location.coordinates[0] !== 0) {
      const distance = calcDistance(coordinates, job.location.coordinates) * 1000;
      if (distance > 300) {
        return res.status(400).json({
          success: false,
          message: `You must be at the job site to check out. You are ${Math.round(distance)}m away (max limit: 300m).`,
        });
      }
    }

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = { type: 'Point', coordinates };
    attendance.status = 'checked_out';
    await attendance.save();

    // Update worker attendance rate statistics
    const totalRecords = await Attendance.countDocuments({ worker: req.user._id });
    const checkedOutRecords = await Attendance.countDocuments({ worker: req.user._id, status: 'checked_out' });
    
    if (req.user.workerProfile) {
      req.user.workerProfile.attendanceRate = Math.round((checkedOutRecords / totalRecords) * 100);
      
      // Update overall reliability score
      const comp = req.user.workerProfile.completionRate || 100;
      const canc = req.user.workerProfile.cancellationRate || 0;
      req.user.workerProfile.reliabilityScore = Math.round(
        req.user.workerProfile.attendanceRate * 0.4 + comp * 0.4 + (100 - canc) * 0.2
      );
      await req.user.save();
    }

    // Notify company
    await Notification.create({
      user: job.company,
      type: 'attendance_checkout',
      title: '🏁 Worker Checked Out',
      message: `${req.user.name} has checked out for "${job.title}". You can now release escrow funds.`,
      data: { jobId, attendanceId: attendance._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(job.company.toString()).emit('notification', {
        type: 'attendance_checkout',
        message: `${req.user.name} checked out!`,
      });
    }

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get check-in status for a job
 * @route   GET /api/attendance/status/:jobId
 * @access  Private (Worker)
 */
export const getAttendanceStatus = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      worker: req.user._id,
      job: req.params.jobId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get attendance records for a job
 * @route   GET /api/attendance/job/:jobId
 * @access  Private (Company)
 */
export const getJobAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ job: req.params.jobId })
      .populate('worker', 'name phone avatar workerProfile rating')
      .sort({ checkInTime: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
