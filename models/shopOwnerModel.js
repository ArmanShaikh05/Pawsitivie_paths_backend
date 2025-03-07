import mongoose from "mongoose";
import { Schema } from "mongoose";

const ShopOwnerSchema = new Schema(
  {
    shopEmail: {
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
    shopDescription: {
      type: String,
    },
    shopAddress: {
      type: String,
    },
    phone: {
      type: String,
    },
    tags: {
      type: Array,
    },
    shopImages: [
      {
        url: {
          type: String,
        },
        public_id: {
          type: String,
        },
      },
    ],
    shopTimmings: {
      weekdays: {
        open: {
          type: String,
        },
        close: {
          type: String,
        },
      },
      weekend: {
        open: {
          type: String,
        },
        close: {
          type: String,
        },
      },
      sundayClosed: {
        type: Boolean,
      },
    },
    shopReviews: [
      {
        review: {
          type: String,
        },
        rating: {
          type: String,
        },
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    shopPets: [
      {
        type: Schema.Types.ObjectId,
        ref: "shopPets",
      },
    ],
    shopProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "products",
      },
    ],
    socialHandles: {
      instagram: {
        type: String,
      },
      facebook: {
        type: String,
      },
      twitter: {
        type: String,
      },
      whatsapp: {
        type: String,
      },
    },
    shopAnalytics: {
      totalRevenue: {
        type: Number,
        default: 0,
      },
      totalProducts: {
        type: Number,
        default: 0,
      },
      totalPetsAdopted: {
        type: Number,
        default: 0,
      },
    },
    orders: {
      type: Schema.Types.ObjectId,
      ref: "orders",
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
  },
  {
    timestamps: true,
  }
);

export const ShopOwner = new mongoose.model("shopOwners", ShopOwnerSchema);
