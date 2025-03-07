import mongoose from "mongoose";
import { Schema } from "mongoose";

const PetDoctorSchema = new Schema(
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
    userId: {
      type: String,
    },
    bio: {
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

    address: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    pincode: {
      type: String,
    },

    speciality: {
      type: String,
    },

    education: {
      type: String,
    },
    experience: {
      type: String,
    },

    appointmentFee: {
      type: Number,
    },

    availableForWork:{
      type:Boolean,
      default:true,
    },

    availability: {
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

    phone: {
      type: String,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews",
      },
    ],

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

export const PetDoctors = new mongoose.model("petDoctors", PetDoctorSchema);
