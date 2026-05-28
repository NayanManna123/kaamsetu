import Rating from '../models/Rating.js';
import User from '../models/User.js';

/**
 * @desc    Create a rating
 * @route   POST /api/ratings
 * @access  Private
 */
export const createRating = async (req, res) => {
  try {
    const { toUserId, jobId, score, review } = req.body;

    if (!toUserId || !jobId || !score) {
      return res.status(400).json({
        success: false,
        message: 'toUserId, jobId, and score are required',
      });
    }

    const rating = await Rating.create({
      from: req.user._id,
      to: toUserId,
      job: jobId,
      score,
      review: review || '',
    });

    // Update the target user's average rating
    const allRatings = await Rating.find({ to: toUserId });
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    await User.findByIdAndUpdate(toUserId, {
      rating: Math.round(avgRating * 10) / 10,
      ratingCount: allRatings.length,
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted',
      data: rating,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Already rated this user for this job',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get ratings for a user
 * @route   GET /api/ratings/user/:userId
 * @access  Public
 */
export const getRatingsForUser = async (req, res) => {
  try {
    const ratings = await Rating.find({ to: req.params.userId })
      .populate('from', 'name avatar role')
      .populate('job', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
