import User from '../models/User.js';
import { paginate, paginatedResponse, calcDistance } from '../utils/helpers.js';
import { matchWorkersToJob } from '../utils/matchEngine.js';
import cacheService from '../utils/cacheService.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all workers with filters
 * @route   GET /api/workers
 * @access  Public
 *
 * Improvements:
 * - Added instantOnly filter for "Available Now" workers
 * - Returns distance when lat/lng provided
 * - Faster with lean() queries
 */
export const getWorkers = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { role: 'worker', isActive: true };

    // Skill filter
    if (req.query.skills) {
      filter['workerProfile.skills'] = { $in: req.query.skills.split(',') };
    }
    // Availability filter
    if (req.query.availability) {
      filter['workerProfile.availability'] = req.query.availability;
    }
    // Instant Available filter — show only "Ready to Work Now" workers
    if (req.query.instantOnly === 'true') {
      filter['workerProfile.isInstantAvailable'] = true;
    }
    // Minimum rating
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating) };
    }
    // Work type preference
    if (req.query.workType) {
      filter['workerProfile.preferredWorkType'] = { $in: [req.query.workType, 'both'] };
    }
    // City
    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city, 'i');
    }

    const total = await User.countDocuments(filter);
    let workers = await User.find(filter)
      .select('-password')
      .sort({ 'workerProfile.isInstantAvailable': -1, rating: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Compute distance if caller provides lat/lng
    if (req.query.lat && req.query.lng) {
      const userCoords = [parseFloat(req.query.lng), parseFloat(req.query.lat)];
      workers = workers.map((w) => {
        if (w.location?.coordinates?.[0] !== 0) {
          w.distance = Math.round(calcDistance(userCoords, w.location.coordinates) * 10) / 10;
        }
        return w;
      });
    }

    res.json(paginatedResponse(workers, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get worker by ID
 * @route   GET /api/workers/:id
 * @access  Public
 */
export const getWorkerById = async (req, res) => {
  try {
    const cacheKey = `workers:${req.params.id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const worker = await User.findOne({
      _id: req.params.id,
      role: 'worker',
    }).select('-password').lean();

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    await cacheService.set(cacheKey, worker, 180); // cache for 3 minutes

    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update worker profile
 * @route   PUT /api/workers/:id
 * @access  Private (Worker own profile)
 */
export const updateWorkerProfile = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = {};
    const allowed = ['name', 'avatar', 'location', 'workerProfile'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const worker = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    // Invalidate cache
    await cacheService.del(`workers:${req.params.id}`);

    res.json({ success: true, message: 'Profile updated', data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle worker availability (Instant Work Mode)
 * @route   PUT /api/workers/:id/availability
 * @access  Private (Worker own profile)
 *
 * Dedicated endpoint for fast availability toggling.
 * Emits socket event so companies see the change in real-time.
 */
export const toggleAvailability = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { isInstantAvailable } = req.body;
    const availability = isInstantAvailable ? 'today' : 'available';

    const worker = await User.findByIdAndUpdate(
      req.params.id,
      {
        'workerProfile.isInstantAvailable': isInstantAvailable,
        'workerProfile.availability': availability,
      },
      { new: true }
    ).select('-password').lean();

    // Invalidate cache
    await cacheService.del(`workers:${req.params.id}`);

    // Emit real-time status change via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('workerAvailabilityChanged', {
        workerId: req.params.id,
        isInstantAvailable,
        name: worker.name,
      });
    }

    res.json({
      success: true,
      message: isInstantAvailable ? 'Instant Work Mode activated' : 'Availability updated',
      data: worker,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Search workers with geo + skills (enhanced with $geoNear for distance)
 * @route   GET /api/workers/search
 * @access  Private (Company)
 *
 * Improvements:
 * - Uses $geoNear aggregation to compute and return exact distance
 * - Instant-available workers sorted first
 * - Returns match-relevant trust indicators
 */
export const searchWorkers = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);

    // If lat/lng provided, use $geoNear aggregation for distance
    if (req.query.lat && req.query.lng) {
      const pipeline = [];
      const maxDist = parseInt(req.query.maxDistance) || 50000; // meters

      // Stage 1: $geoNear (must be first)
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
          },
          distanceField: 'distanceMeters',
          maxDistance: maxDist,
          query: { role: 'worker', isActive: true },
          spherical: true,
        },
      });

      // Stage 2: Additional filters
      const matchStage = {};
      if (req.query.q) {
        matchStage.name = { $regex: req.query.q, $options: 'i' };
      }
      if (req.query.skills) {
        matchStage['workerProfile.skills'] = { $in: req.query.skills.split(',') };
      }
      if (req.query.minRating) {
        matchStage.rating = { $gte: parseFloat(req.query.minRating) };
      }
      if (req.query.availability) {
        matchStage['workerProfile.availability'] = req.query.availability;
      }
      if (req.query.instantOnly === 'true') {
        matchStage['workerProfile.isInstantAvailable'] = true;
      }

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Stage 3: Add computed distance in km
      pipeline.push({
        $addFields: {
          distance: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
        },
      });

      // Stage 4: Sort — instant available first, then by distance
      pipeline.push({
        $sort: { 'workerProfile.isInstantAvailable': -1, distanceMeters: 1 },
      });

      // Stage 5: Remove password
      pipeline.push({ $project: { password: 0 } });

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await User.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Stage 6: Paginate
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      const workers = await User.aggregate(pipeline);

      return res.json(paginatedResponse(workers, total, page, limit));
    }

    // Fallback: no geo — standard find query
    const filter = { role: 'worker', isActive: true };
    if (req.query.q) {
      filter.name = new RegExp(req.query.q, 'i');
    }
    if (req.query.skills) {
      filter['workerProfile.skills'] = { $in: req.query.skills.split(',') };
    }
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating) };
    }
    if (req.query.availability) {
      filter['workerProfile.availability'] = req.query.availability;
    }
    if (req.query.instantOnly === 'true') {
      filter['workerProfile.isInstantAvailable'] = true;
    }

    const total = await User.countDocuments(filter);
    const workers = await User.find(filter)
      .select('-password')
      .sort({ 'workerProfile.isInstantAvailable': -1, rating: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(paginatedResponse(workers, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get nearby workers using $geoNear
 * @route   GET /api/workers/nearby
 * @access  Private (Company)
 */
export const getNearbyWorkers = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Please provide lat and lng' });
    }

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: 'distanceMeters',
          maxDistance: parseInt(maxDistance),
          query: {
            role: 'worker',
            isActive: true,
            'workerProfile.availability': { $in: ['today', 'available'] },
          },
          spherical: true,
        },
      },
      {
        $addFields: {
          distance: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
        },
      },
      { $sort: { 'workerProfile.isInstantAvailable': -1, distanceMeters: 1 } },
      { $project: { password: 0 } },
      { $limit: 20 },
    ];

    const workers = await User.aggregate(pipeline);

    res.json({ success: true, count: workers.length, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get suggested workers for a job (uses match engine)
 * @route   GET /api/workers/suggested/:jobId
 * @access  Private (Company)
 */
export const getSuggestedWorkers = async (req, res) => {
  try {
    const Job = (await import('../models/Job.js')).default;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const workers = await matchWorkersToJob(job);

    res.json({ success: true, count: workers.length, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
