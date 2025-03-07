import mongoose from "mongoose";
import { Schema } from "mongoose";

const AppointmentSchema = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    shopRecieverId: { type: mongoose.Schema.Types.ObjectId, ref: "shopOwners" },
    description: { type: String },
    status: {
      type: String,
      enum: ["completed", "pending","failed"],
      default: "pending",
    },
    startTime: { type: String },
    endTime: { type: String },
    subject: { type: String },
    isScheduled: { type: Boolean, default: false },
    clientDetails: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phoneNo: { type: String },
    },
    appointmentDate: { type: String },
    resources:{
      petId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "shopPets",
      }
    },
  },
  { timestamps: true }
);

export const Appointments = new mongoose.model(
  "Appointments",
  AppointmentSchema
);
