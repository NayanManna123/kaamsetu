import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Model
 * Supports three roles: worker, company, admin
 * Worker and Company profiles are embedded sub-documents
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOtp: {
      type: String,
      default: null,
    },
    emailVerificationOtpExpires: {
      type: Date,
      default: null,
    },
    phoneVerificationOtp: {
      type: String,
      default: null,
    },
    phoneVerificationOtpExpires: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['worker', 'company', 'admin'],
      required: [true, 'Role is required'],
    },
    avatar: {
      type: String,
      default: '',
    },

    // --- Location (GeoJSON for proximity queries) ---
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: '' },
      city: { type: String, default: '' },
    },

    // --- Worker-specific profile ---
    workerProfile: {
      skills: {
        type: [String],
        default: [],
      },
      experience: { type: Number, default: 0 }, // years
      preferredWorkType: {
        type: String,
        enum: ['daily', 'contract', 'both'],
        default: 'both',
      },
      availability: {
        type: String,
        enum: ['today', 'this_week', 'available', 'unavailable'],
        default: 'available',
      },
      expectedWage: { type: Number, default: 0 }, // per day in ₹
      bio: { type: String, default: '' },
      completedJobs: { type: Number, default: 0 },
      attendanceRate: { type: Number, default: 100 }, // percentage
      completionRate: { type: Number, default: 100 }, // percentage
      cancellationRate: { type: Number, default: 0 }, // percentage
      reliabilityScore: { type: Number, default: 100 }, // overall score (0-100)
      isInstantAvailable: { type: Boolean, default: false }, // "Instant Work Mode"
    },

    // --- Company-specific profile ---
    companyProfile: {
      companyName: { type: String, default: '' },
      businessType: { type: String, default: '' },
      description: { type: String, default: '' },
      verified: { type: Boolean, default: false },
      totalJobsPosted: { type: Number, default: 0 },
      totalWorkersHired: { type: Number, default: 0 },
      trustScore: { type: Number, default: 100 }, // overall score (0-100)
      paymentHistoryRate: { type: Number, default: 100 }, // percentage
    },

    // --- Rating system ---
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // --- Account status ---
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // --- Wallet for workers ---
    wallet: {
      balance: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Index for searching workers by skills
userSchema.index({ 'workerProfile.skills': 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
