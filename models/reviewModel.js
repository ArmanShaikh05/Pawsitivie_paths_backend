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
      type: Schema.Types.ObjectId,
      ref: "users",
    }
  },
  {
    timestamps: true,
  }
);

export const Review = new mongoose.model("reviews", ReviewSchema);
