import mongoose from 'mongoose';

/**
 * Settings Model
 * Serves dual purposes:
 * 1. Global site settings (isGlobal = true, userId = null) e.g., social links
 * 2. User settings (isGlobal = false, userId = reference to User) e.g., notifications, language, payments
 */
const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Global Settings (Social Links)
    github: {
      type: String,
      default: 'https://github.com/kaamsetu',
    },
    instagram: {
      type: String,
      default: 'https://instagram.com/kaamsetu',
    },
    twitter: {
      type: String,
      default: 'https://twitter.com/kaamsetu',
    },
    linkedin: {
      type: String,
      default: 'https://linkedin.com/company/kaamsetu',
    },
    // User Settings (Notifications)
    notifications: {
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      jobAlerts: {
        type: Boolean,
        default: true,
      },
      hireRequests: {
        type: Boolean,
        default: true,
      },
    },
    // User Settings (Language)
    language: {
      type: String,
      enum: ['en', 'hi', 'gu'],
      default: 'en',
    },
    // User Settings (Payment Details)
    upiId: {
      type: String,
      default: '',
    },
    bankDetails: {
      accountNumber: {
        type: String,
        default: '',
      },
      ifscCode: {
        type: String,
        default: '',
      },
      bankName: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
