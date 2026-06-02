import mongoose from 'mongoose';

/**
 * Event Model
 * Supports daily, contract, internship, part-time, full-time categories
 * Supports online, offline, hybrid modes
 * Uses GeoJSON for location searches
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 200,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Company organizer is required'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: 3000,
    },
    hiringType: {
      type: [String],
      enum: ['Daily Workers', 'Contract Workers', 'Internship', 'Part-Time', 'Full-Time', 'Multiple Categories'],
      required: [true, 'Hiring type is required'],
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // e.g. "17:00"
      required: [true, 'End time is required'],
    },
    positionsCount: {
      type: Number,
      required: [true, 'Number of positions is required'],
      min: 1,
      default: 1,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    salaryRange: {
      type: String,
      required: [true, 'Salary / Wage range is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    eventMode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: [true, 'Event mode is required'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    virtualLink: {
      type: String,
      default: '',
    },
    slots: [
      {
        time: { type: String, required: true }, // e.g., "10:00 AM - 10:30 AM"
        maxCapacity: { type: Number, default: 10 },
        bookedCount: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['published', 'completed', 'cancelled'],
      default: 'published',
    },
    chatMessages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderName: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location search
eventSchema.index({ location: '2dsphere' });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ company: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
