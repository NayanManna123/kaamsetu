import mongoose from 'mongoose';

/**
 * Rating Model
 * Both workers and companies can rate each other after job completion
 */
const ratingSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// One rating per user per job
ratingSchema.index({ from: 1, to: 1, job: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
