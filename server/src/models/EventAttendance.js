import mongoose from 'mongoose';

/**
 * EventAttendance Model
 * Captures check-in logs during hiring events
 */
const eventAttendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRegistration',
      required: true,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Company representative who scanned or checked them in
      required: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

eventAttendanceSchema.index({ event: 1, user: 1 }, { unique: true });

const EventAttendance = mongoose.model('EventAttendance', eventAttendanceSchema);
export default EventAttendance;
