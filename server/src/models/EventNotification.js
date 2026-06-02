import mongoose from 'mongoose';

/**
 * EventNotification Model
 * Stores in-app alerts and notifications regarding hiring events
 */
const eventNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    type: {
      type: String,
      enum: ['reminder', 'confirmation', 'interview_schedule', 'selection_result'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

eventNotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const EventNotification = mongoose.model('EventNotification', eventNotificationSchema);
export default EventNotification;
