import mongoose from "mongoose";
import { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    productName: {
      type: String,
    },
    productDescription: {
      type: String,
    },
    productSummary: {
      type: String,
    },
    petAge: {
      type: String,
    },
    productImages: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    productPrice: {
      type: Number,
    },
    petType: {
      type: String,
    },
    shopName: {
      type: String,
    },
    shopOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shopOwners",
    },
    productMaterial: {
      type: String,
    },
    availableSizes: [
      {
        type: String,
      },
    ],
    productCategory: {
      type: String,
    },
    inStock: {
      type: Boolean,
    },
    productQuantity: {
      type: Number,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Product = new mongoose.model("products", ProductSchema);
