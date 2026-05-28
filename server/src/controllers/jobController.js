import Job from '../models/Job.js';
import { paginate, paginatedResponse } from '../utils/helpers.js';
import { matchJobsToWorker } from '../utils/matchEngine.js';
import cacheService from '../utils/cacheService.js';

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private (Company)
 */
export const createJob = async (req, res) => {
  try {
    req.body.company = req.user._id;

    // Sync explicit latitude and longitude with GeoJSON location coordinates
    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      req.body.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
        address: req.body.address || req.body.location?.address || '',
        city: req.body.city || req.body.location?.city || '',
      };
    }

    const job = await Job.create(req.body);

    // Increment company's totalJobsPosted
    await req.user.updateOne({
      $inc: { 'companyProfile.totalJobsPosted': 1 },
    });

    // Invalidate cache
    await cacheService.delStartWith('jobs:');

    const populated = await Job.findById(job._id).populate(
      'company',
      'name companyProfile avatar rating'
    );

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all jobs with filtering and pagination
 * @route   GET /api/jobs
 * @access  Public
 */
export const getJobs = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { status: 'open' };

    // Apply filters
    if (req.query.workType) filter.workType = req.query.workType;
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.skills) {
      filter.skills = { $in: req.query.skills.split(',') };
    }
    if (req.query.minPay || req.query.maxPay) {
      filter.pay = {};
      if (req.query.minPay) filter.pay.$gte = parseInt(req.query.minPay);
      if (req.query.maxPay) filter.pay.$lte = parseInt(req.query.maxPay);
    }
    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city, 'i');
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('company', 'name companyProfile avatar rating')
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(paginatedResponse(jobs, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'company',
      'name companyProfile avatar rating phone'
    );

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update job
 * @route   PUT /api/jobs/:id
 * @access  Private (Company owner)
 */
export const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Sync explicit latitude and longitude with GeoJSON location coordinates
    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      req.body.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
        address: req.body.address || req.body.location?.address || job.location?.address || '',
        city: req.body.city || req.body.location?.city || job.location?.city || '',
      };
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('company', 'name companyProfile avatar rating');

    // Invalidate cache
    await cacheService.delStartWith('jobs:');

    res.json({ success: true, message: 'Job updated', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Company owner)
 */
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await job.deleteOne();

    // Invalidate cache
    await cacheService.delStartWith('jobs:');

    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Search jobs with geo and filters
 * @route   GET /api/jobs/search
 * @access  Public
 */
export const searchJobs = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { status: 'open' };

    if (req.query.q) {
      filter.$or = [
        { title: new RegExp(req.query.q, 'i') },
        { description: new RegExp(req.query.q, 'i') },
      ];
    }
    if (req.query.workType) filter.workType = req.query.workType;
    if (req.query.skills) filter.skills = { $in: req.query.skills.split(',') };
    if (req.query.minPay) filter.pay = { ...filter.pay, $gte: parseInt(req.query.minPay) };
    if (req.query.maxPay) filter.pay = { ...filter.pay, $lte: parseInt(req.query.maxPay) };

    // Geo search
    if (req.query.lat && req.query.lng) {
      const maxDist = parseInt(req.query.maxDistance) || 50000; // meters
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
          },
          $maxDistance: maxDist,
        },
      };
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('company', 'name companyProfile avatar rating')
      .skip(skip)
      .limit(limit);

    res.json(paginatedResponse(jobs, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get urgent jobs (today)
 * @route   GET /api/jobs/urgent
 * @access  Public
 */
export const getUrgentJobs = async (req, res) => {
  try {
    const cacheKey = 'jobs:urgent';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, count: cached.length, data: cached });
    }

    const jobs = await Job.find({ urgency: 'urgent', status: 'open' })
      .populate('company', 'name companyProfile avatar rating')
      .sort({ createdAt: -1 })
      .limit(10);

    await cacheService.set(cacheKey, jobs, 120); // 2 minutes cache

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get nearby jobs based on coordinates
 * @route   GET /api/jobs/nearby
 * @access  Public
 */
export const getNearbyJobs = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 25000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lat and lng',
      });
    }

    const jobs = await Job.find({
      status: 'open',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate('company', 'name companyProfile avatar rating')
      .limit(20);

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get recommended jobs for current worker
 * @route   GET /api/jobs/recommended
 * @access  Private (Worker)
 */
export const getRecommendedJobs = async (req, res) => {
  try {
    const jobs = await matchJobsToWorker(req.user, {
      maxDistance: 50000,
      limit: 15,
    });

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get jobs posted by current company
 * @route   GET /api/jobs/my
 * @access  Private (Company)
 */
export const getMyJobs = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { company: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(paginatedResponse(jobs, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
