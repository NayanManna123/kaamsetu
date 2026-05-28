import Escrow from '../models/Escrow.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Job from '../models/Job.js';

/**
 * @desc    Get escrow details for a job
 * @route   GET /api/escrow/job/:jobId
 * @access  Private (Company & Worker)
 */
export const getEscrowByJob = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ job: req.params.jobId })
      .populate('worker', 'name phone avatar')
      .populate('company', 'name companyProfile')
      .populate('job', 'title pay status');

    if (!escrow) {
      return res.status(404).json({ success: false, message: 'No escrow found for this job' });
    }

    res.json({ success: true, data: escrow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Release escrow funds to worker
 * @route   PUT /api/escrow/:escrowId/release
 * @access  Private (Company owner)
 */
export const releaseEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.escrowId);
    if (!escrow) {
      return res.status(404).json({ success: false, message: 'Escrow record not found' });
    }

    if (escrow.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to release these funds' });
    }

    if (escrow.status !== 'held') {
      return res.status(400).json({ success: false, message: `Escrow is already ${escrow.status}` });
    }

    // Release escrow
    escrow.status = 'released';
    escrow.releasedAt = new Date();
    await escrow.save();

    // Credit worker wallet
    const worker = await User.findById(escrow.worker);
    if (!worker.wallet) {
      worker.wallet = { balance: 0, currency: 'INR' };
    }
    worker.wallet.balance += escrow.amount;
    
    // Update worker jobs statistics
    if (!worker.workerProfile) {
      worker.workerProfile = {};
    }
    worker.workerProfile.completedJobs = (worker.workerProfile.completedJobs || 0) + 1;
    
    // Update worker reliability score (increase completion rate)
    const completed = worker.workerProfile.completedJobs;
    const attendance = worker.workerProfile.attendanceRate || 100;
    worker.workerProfile.completionRate = Math.min(100, Math.round((completed / (completed + (worker.workerProfile.cancellationRate || 0) / 10)) * 100));
    
    // Update overall reliability score
    worker.workerProfile.reliabilityScore = Math.round(
      attendance * 0.4 + worker.workerProfile.completionRate * 0.4 + (100 - (worker.workerProfile.cancellationRate || 0)) * 0.2
    );
    await worker.save();

    // Log Wallet transaction for worker
    await WalletTransaction.create({
      user: escrow.worker,
      amount: escrow.amount,
      type: 'earning',
      status: 'completed',
      description: `Earning from job: ${escrow.job}`,
      referenceId: escrow._id,
    });

    // Update Company trust details
    const company = await User.findById(escrow.company);
    const totalJobs = company.companyProfile?.totalJobsPosted || 1;
    company.companyProfile.paymentHistoryRate = Math.min(100, Math.round(((company.companyProfile.totalWorkersHired || 1) / totalJobs) * 100));
    company.companyProfile.trustScore = Math.min(100, Math.round(company.companyProfile.paymentHistoryRate * 0.7 + (company.rating / 5) * 30));
    await company.save();

    res.json({
      success: true,
      message: 'Escrow released and worker credited successfully',
      data: escrow,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get company financial stats (held, released, total spent)
 * @route   GET /api/escrow/stats
 * @access  Private (Company)
 */
export const getCompanyEscrowStats = async (req, res) => {
  try {
    const escrows = await Escrow.find({ company: req.user._id });
    
    let totalHeld = 0;
    let totalReleased = 0;
    let totalRefunded = 0;

    escrows.forEach((esc) => {
      if (esc.status === 'held') totalHeld += esc.amount;
      else if (esc.status === 'released') totalReleased += esc.amount;
      else if (esc.status === 'refunded') totalRefunded += esc.amount;
    });

    res.json({
      success: true,
      data: {
        totalHeld,
        totalReleased,
        totalRefunded,
        totalSpent: totalReleased,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
