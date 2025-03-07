import mongoose from "mongoose";
import { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
    },
    userName: {
      type: String,
    },
    uid: {
      type: String,
    },
    role: {
      type: String,
    },
    shopName: {
      type: String,
    },
    userId: {
      type: String,
    },
    bio: {
      type: String,
    },
    DOB: {
      type: String,
    },
    profilePic: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    whishlistPets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shopPets",
      },
    ],

    whishlistShops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shopOwners",
      },
    ],

    whishlistProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
    ],

    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
      },
    ],

    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    ownedPets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ownedPets",
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews",
      },
    ],
    shippingAddress: {
      state: {
        type: String,
      },
      city: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },

    cartItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
        quantity: { type: Number, required: true },
        size: { type: String, default: "null" },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: "shopOwners" },
      },
    ],

    shippingAddress: {
      state: {
        type: String,
      },
      city: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },

    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notifications",
      },
    ],
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointments",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    bookmarkedPosts:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
      }
    ]
  },
  {
    timestamps: true,
  }
);

export const User = new mongoose.model("users", UserSchema);
