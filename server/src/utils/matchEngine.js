import User from '../models/User.js';
import Job from '../models/Job.js';
import { calcDistance } from './helpers.js';

/**
 * Smart Matching Engine
 * Matches workers to jobs and jobs to workers based on:
 * - Skills overlap (45%)
 * - Location proximity (25%) — tighter distance bands
 * - Availability / Instant Work Mode (15%)
 * - Rating and Reliability score (15%) — includes noShow %
 *
 * Improvements:
 * - Uses lean() queries for faster serialization
 * - Tighter distance scoring (<2km = 25pts, <5km = 22pts, <10km = 18pts)
 * - noShowPercentage impacts reliability scoring
 */

/**
 * Match workers to a specific job
 * Returns workers sorted by match score (highest first)
 */
export const matchWorkersToJob = async (job, options = {}) => {
  const { maxDistance = 50000, limit = 20 } = options; // 50km default

  const query = {
    role: 'worker',
    isActive: true,
  };

  // Find workers with at least one matching skill if job specifies skills
  if (job.skills && job.skills.length > 0) {
    query['workerProfile.skills'] = { $in: job.skills };
  }

  // Find nearby workers using MongoDB geo queries
  if (job.location && job.location.coordinates[0] !== 0) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: job.location.coordinates,
        },
        $maxDistance: maxDistance,
      },
    };
  }

  // Use lean() for faster serialization
  const workers = await User.find(query).limit(limit * 2).select('-password').lean();

  // Score each worker for ranking
  const scored = workers.map((worker) => {
    let score = 0;

    // 1. Skills overlap score (0-45 points)
    if (job.skills && worker.workerProfile?.skills) {
      const overlap = worker.workerProfile.skills.filter((s) =>
        job.skills.includes(s)
      ).length;
      score += (overlap / Math.max(job.skills.length, 1)) * 45;
    }

    // 2. Distance score (0-25 points) — tighter scoring bands
    let dist = null;
    if (
      job.location &&
      job.location.coordinates[0] !== 0 &&
      worker.location &&
      worker.location.coordinates[0] !== 0
    ) {
      dist = calcDistance(job.location.coordinates, worker.location.coordinates); // in km
      if (dist < 2) score += 25;
      else if (dist < 5) score += 22;
      else if (dist < 10) score += 18;
      else if (dist < 20) score += 12;
      else if (dist < 35) score += 7;
      else if (dist < 50) score += 3;
    } else {
      score += 10; // baseline distance score if coords missing
    }

    // 3. Availability & Instant Work Mode score (0-15 points)
    if (worker.workerProfile?.isInstantAvailable) {
      score += 15;
    } else if (worker.workerProfile?.availability === 'today') {
      score += 12;
    } else if (worker.workerProfile?.availability === 'this_week') {
      score += 8;
    } else if (worker.workerProfile?.availability === 'available') {
      score += 5;
    }

    // 4. Rating & Reliability score (0-15 points) — includes noShow penalty
    const ratingWeight = 7;
    const reliabilityWeight = 8;
    
    score += (worker.rating / 5) * ratingWeight;
    
    const reliability = worker.workerProfile?.reliabilityScore ?? 100;
    const noShowPenalty = (worker.workerProfile?.cancellationRate ?? 0) * 0.1; // 10% per noShow point
    score += Math.max(0, (reliability / 100) * reliabilityWeight - noShowPenalty);

    // Build enriched worker object
    worker.matchScore = Math.round(score * 10) / 10;
    worker.distance = dist !== null ? Math.round(dist * 10) / 10 : null;

    return { worker, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.worker);
};

/**
 * Match jobs to a specific worker
 * Returns jobs sorted by relevance
 */
export const matchJobsToWorker = async (worker, options = {}) => {
  const { maxDistance = 25000, limit = 20 } = options; // Reduced default to 25km

  const query = {
    status: 'open',
  };

  // Match by worker skills
  if (worker.workerProfile?.skills?.length > 0) {
    query.skills = { $in: worker.workerProfile.skills };
  }

  // Match by preferred work type
  if (
    worker.workerProfile?.preferredWorkType &&
    worker.workerProfile.preferredWorkType !== 'both'
  ) {
    query.workType = worker.workerProfile.preferredWorkType;
  }

  // Location proximity
  if (worker.location && worker.location.coordinates[0] !== 0) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: worker.location.coordinates,
        },
        $maxDistance: maxDistance,
      },
    };
  }

  // Use lean() for faster serialization
  const jobs = await Job.find(query)
    .populate('company', 'name companyProfile avatar rating')
    .limit(limit * 2)
    .lean();

  // Score each job for worker ranking
  const scored = jobs.map((job) => {
    let score = 0;
    const company = job.company || {};

    // 1. Skill overlap (0-45 points)
    if (job.skills && worker.workerProfile?.skills) {
      const overlap = job.skills.filter((s) =>
        worker.workerProfile.skills.includes(s)
      ).length;
      score += (overlap / Math.max(job.skills.length, 1)) * 45;
    }

    // 2. Distance score (0-25 points) — tighter bands
    let dist = null;
    if (
      job.location &&
      job.location.coordinates[0] !== 0 &&
      worker.location &&
      worker.location.coordinates[0] !== 0
    ) {
      dist = calcDistance(job.location.coordinates, worker.location.coordinates);
      if (dist < 2) score += 25;
      else if (dist < 5) score += 22;
      else if (dist < 10) score += 18;
      else if (dist < 20) score += 12;
      else if (dist < 35) score += 7;
      else if (dist < 50) score += 3;
    } else {
      score += 10;
    }

    // 3. Job Urgency score (0-15 points)
    if (job.urgency === 'urgent') score += 15;
    else score += 5;

    // 4. Company Trust & Rating score (0-15 points)
    const companyRating = company.rating || 0;
    score += (companyRating / 5) * 7.5;

    const companyTrust = company.companyProfile?.trustScore ?? 100;
    score += (companyTrust / 100) * 7.5;

    job.matchScore = Math.round(score * 10) / 10;
    job.distance = dist !== null ? Math.round(dist * 10) / 10 : null;

    return { job, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.job);
};
