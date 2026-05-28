import mongoose from 'mongoose';

/**
 * Escrow Model
 * Represents job funds that are:
 * - pending: job posted but not yet locked
 * - held: company hired worker (funds locked)
 * - released: job completed, funds paid to worker wallet
 * - refunded: job cancelled, funds returned to company
 */
const escrowSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Escrow amount is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded'],
      default: 'pending',
    },
    releasedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
escrowSchema.index({ job: 1 });
escrowSchema.index({ worker: 1 });
escrowSchema.index({ company: 1 });
escrowSchema.index({ status: 1 });

const Escrow = mongoose.model('Escrow', escrowSchema);
export default Escrow;
