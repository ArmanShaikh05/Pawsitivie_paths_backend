import mongoose from "mongoose";
import { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    review: {
      type: String,
    },
    rating: {
      type: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    doctorId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "petDoctors",
    }
  },
  {
    timestamps: true,
  }
);

export const Review = new mongoose.model("reviews", ReviewSchema);
