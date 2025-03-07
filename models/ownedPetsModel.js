import mongoose from "mongoose";
import { Schema } from "mongoose";

const OwnedPetsSchema = new Schema(
  {
    petName: {
      type: String,
    },
    petAbout: {
      type: String,
    },
    petAge:{
        type:String,
    },
    petImg: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const OwnedPets = new mongoose.model("ownedPets", OwnedPetsSchema);
