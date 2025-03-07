import mongoose from "mongoose";
import { Schema } from "mongoose";

const ShopPetsSchema = new Schema(
  {
    petName: {
      type: String,
    },
    petDescription: {
      type: String,
    },
    petAge: {
      type: String,
    },
    petImages: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    petPrice:{
        type: Number,
    },
    petGender:{
        type: String,
    },
    petSize:{
        type: String,
    },
    petBreed:{
        type: String,
    },
    petColor:{
        type: String,
    },
    petCategory:{
        type: String,
    },
    petLocation:{
        type: String,
    },
    isVaccinated:{
        type:Boolean,
    },
    isDewormed:{
        type:Boolean,
    },
    reviews:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"reviews"
      }
    ]
  },
  {
    timestamps: true,
  }
);

export const ShopPets = new mongoose.model("shopPets", ShopPetsSchema);
