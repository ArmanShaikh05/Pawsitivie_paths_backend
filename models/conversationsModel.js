import mongoose from "mongoose";
import { Schema } from "mongoose";

const ConversationSchema = new Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "messages",
      },
    ],
    
  },
  { timestamps: true }
);

export const Conversations = new mongoose.model(
  "conversations",
  ConversationSchema
);
