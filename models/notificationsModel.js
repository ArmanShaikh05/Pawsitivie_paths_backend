import mongoose from "mongoose";
import { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true },
    notiType: { type: String, required: true },
    notiTitle: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    avatar: { type: String },
    senderName: { type: String },

    resource: {
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointments",
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Notifications = new mongoose.model(
  "Notifications",
  NotificationSchema
);
