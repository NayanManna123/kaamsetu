import mongoose from 'mongoose';

/**
 * Attendance Model
 * Tracks daily worker check-ins and check-outs at job sites
 */
const attendanceSchema = new mongoose.Schema(
  {
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
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
    },
    checkInLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    checkOutLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out'],
      default: 'checked_in',
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location queries
attendanceSchema.index({ checkInLocation: '2dsphere' });
attendanceSchema.index({ checkOutLocation: '2dsphere' });

// Simple compound indexes for history lookup
attendanceSchema.index({ worker: 1, job: 1 });
attendanceSchema.index({ job: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
