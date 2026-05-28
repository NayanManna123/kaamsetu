import mongoose from 'mongoose';

/**
 * Job Model
 * Supports daily, contract, and instant job types
 * Uses GeoJSON for location-based search
 */
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Company is required'],
    },
    workType: {
      type: String,
      enum: ['daily', 'contract', 'instant'],
      required: [true, 'Work type is required'],
    },
    pay: {
      type: Number,
      required: [true, 'Pay is required'],
      min: 0,
    },
    payType: {
      type: String,
      enum: ['per_day', 'fixed', 'per_hour'],
      default: 'per_day',
    },
    workersNeeded: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    workersHired: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    // GeoJSON location
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
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    startTime: {
      type: String, // e.g. "09:00"
      default: '09:00',
    },
    duration: {
      type: String, // e.g. "8 hours", "3 days"
      default: '1 day',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geo queries
jobSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
jobSchema.index({ status: 1, workType: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ urgency: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
export default Job;
