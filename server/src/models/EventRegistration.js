import mongoose from 'mongoose';

/**
 * EventRegistration Model
 * Records a user's registration for a specific hiring event
 */
const eventRegistrationSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    resume: {
      type: String,
      default: '',
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
    },
    qrCode: {
      type: String, // Can store base64 data-uri or the registration ID text itself
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'checked_in', 'interviewed', 'selected', 'rejected'],
      default: 'registered',
    },
    interviewSlot: {
      type: String, // e.g. "10:30 AM - 11:00 AM"
      default: '',
    },
    certificateUrl: {
      type: String,
      default: '',
    },
    rankingScore: {
      type: Number, // AI Candidate Ranking Score (0-100)
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ registrationId: 1 });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;
