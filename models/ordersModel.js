import mongoose from "mongoose";
import { Schema } from "mongoose";

const OrdersSchema = new Schema(
  {
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
        productQty: {
          type: Number,
          default: 1,
        },
        shopId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "shopOwners",
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "inTransition",
        "shipped",
        "outForDelivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    shippingDetails: {
      shippingCharge: {
        type: String,
      },
      discountAmount: {
        type: String,
      },
      taxAmount: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Orders = new mongoose.model("orders", OrdersSchema);
