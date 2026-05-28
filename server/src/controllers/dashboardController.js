import User from '../models/User.js';
import Job from '../models/Job.js';
import HireRequest from '../models/HireRequest.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';

/**
 * @desc    Get aggregated worker dashboard stats
 * @route   GET /api/dashboard/worker
 * @access  Private (Worker)
 *
 * Returns all stats in a single call:
 * - Today's earnings, total completed jobs, rating, completion/reliability scores
 * - Pending hire requests count
 * - Unread notification count
 */
export const getWorkerDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Parallel queries for speed
    const [
      pendingHires,
      acceptedHires,
      totalApplications,
      acceptedApplications,
      unreadNotifications,
    ] = await Promise.all([
      HireRequest.countDocuments({ worker: userId, status: 'pending' }),
      HireRequest.countDocuments({ worker: userId, status: 'accepted' }),
      Application.countDocuments({ worker: userId }),
      Application.countDocuments({ worker: userId, status: 'accepted' }),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    // Calculate today's earnings from escrow releases
    let todaysEarnings = 0;
    try {
      const Escrow = (await import('../models/Escrow.js')).default;
      const todayEscrows = await Escrow.find({
        worker: userId,
        status: 'released',
        updatedAt: { $gte: todayStart },
      });
      todaysEarnings = todayEscrows.reduce((sum, e) => sum + (e.amount || 0), 0);
    } catch (e) {
      // Escrow may not exist yet
    }

    const profile = req.user.workerProfile || {};

    res.json({
      success: true,
      data: {
        todaysEarnings,
        totalCompletedJobs: profile.completedJobs || 0,
        rating: req.user.rating || 0,
        ratingCount: req.user.ratingCount || 0,
        completionRate: profile.completionRate || 100,
        attendanceRate: profile.attendanceRate || 100,
        reliabilityScore: profile.reliabilityScore || 100,
        cancellationRate: profile.cancellationRate || 0,
        isInstantAvailable: profile.isInstantAvailable || false,
        availability: profile.availability || 'available',
        pendingHireRequests: pendingHires,
        activeHires: acceptedHires,
        totalApplications,
        acceptedApplications,
        unreadNotifications,
        walletBalance: req.user.wallet?.balance || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get aggregated company dashboard stats
 * @route   GET /api/dashboard/company
 * @access  Private (Company)
 *
 * Returns all stats in a single call:
 * - Jobs posted, active jobs, workers hired, hiring success rate
 * - Financial summary, unread notifications
 */
export const getCompanyDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Parallel queries for speed
    const [
      totalJobs,
      activeJobs,
      totalHiresSent,
      acceptedHires,
      rejectedHires,
      unreadNotifications,
    ] = await Promise.all([
      Job.countDocuments({ company: userId }),
      Job.countDocuments({ company: userId, status: { $in: ['open', 'in_progress'] } }),
      HireRequest.countDocuments({ company: userId }),
      HireRequest.countDocuments({ company: userId, status: 'accepted' }),
      HireRequest.countDocuments({ company: userId, status: 'rejected' }),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    // Total workers hired (from jobs)
    const jobAgg = await Job.aggregate([
      { $match: { company: userId } },
      { $group: { _id: null, totalHired: { $sum: '$workersHired' } } },
    ]);
    const totalWorkersHired = jobAgg[0]?.totalHired || 0;

    // Hiring success rate
    const hiringSuccessRate =
      totalHiresSent > 0
        ? Math.round((acceptedHires / totalHiresSent) * 100)
        : 0;

    // Financial stats from escrow
    let financeStats = { totalHeld: 0, totalReleased: 0, totalSpent: 0 };
    try {
      const Escrow = (await import('../models/Escrow.js')).default;
      const escrowAgg = await Escrow.aggregate([
        { $match: { company: userId } },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
          },
        },
      ]);
      for (const item of escrowAgg) {
        if (item._id === 'held') financeStats.totalHeld = item.total;
        if (item._id === 'released') financeStats.totalReleased = item.total;
      }
      financeStats.totalSpent = financeStats.totalHeld + financeStats.totalReleased;
    } catch (e) {
      // Escrow may not exist
    }

    const profile = req.user.companyProfile || {};

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalWorkersHired,
        hiringSuccessRate,
        rating: req.user.rating || 0,
        ratingCount: req.user.ratingCount || 0,
        verified: profile.verified || false,
        trustScore: profile.trustScore || 100,
        paymentHistoryRate: profile.paymentHistoryRate || 100,
        totalHiresSent,
        acceptedHires,
        rejectedHires,
        unreadNotifications,
        financeStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
