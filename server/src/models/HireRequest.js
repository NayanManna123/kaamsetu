import mongoose from 'mongoose';

/**
 * HireRequest Model
 * Companies can directly hire workers for specific jobs
 */
const hireRequestSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      default: '',
      maxlength: 500,
    },
    offeredPay: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate hire requests for same worker-job combo
hireRequestSchema.index({ company: 1, worker: 1, job: 1 }, { unique: true });

const HireRequest = mongoose.model('HireRequest', hireRequestSchema);
export default HireRequest;
