import mongoose from "mongoose";
import { Schema } from "mongoose";

const PostSchema = new Schema(
  {
    postContent: { type: String },
    postImages: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    tags: { type: Array },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  {
    timestamps: true,
  }
);

export const Posts = new mongoose.model("posts", PostSchema);
