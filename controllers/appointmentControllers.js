import { PET_ADOPTION } from "../data/constants.js";
import { Appointments } from "../models/appointmentModel.js";
import { Notifications } from "../models/notificationsModel.js";
import { PetDoctors } from "../models/petDoctorModel.js";
import { ShopOwner } from "../models/shopOwnerModel.js";
import { ShopPets } from "../models/shopPetsModel.js";
import { User } from "../models/userModels.js";
import { sendNotification } from "../socket/socketManager.js";
import { combineDateTime } from "../utils/feature.js";
import moment from "moment";

const createShopAppointment = async (req, res, next) => {
  try {
    const {
      userId,
      shopOwnerId,
      description,
      startTime,
      endTime,
      clientDetails,
      subject,
      appointmentDate,
      resources,
    } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const shopOwner = await ShopOwner.findById(shopOwnerId);
    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "No shopOwner found",
      });

    // Check if the user already has an appointment between the given start and end time
    const existingAppointment = await Appointments.findOne({
      clientId: userId,
      appointmentDate: appointmentDate,
      $or: [
        {
          startTime: { $lt: combineDateTime(appointmentDate, endTime) },
          endTime: { $gt: combineDateTime(appointmentDate, startTime) },
        },
      ],
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "You already have an appointment at this time",
      });
    }

    // Creating Appointment Logic

    const appointment = await Appointments.create({
      clientId: userId,
      shopRecieverId: shopOwnerId,
      description: description,
      startTime: combineDateTime(appointmentDate, startTime),
      endTime: combineDateTime(appointmentDate, endTime),
      subject: subject,
      clientDetails: clientDetails,
      appointmentDate: appointmentDate,
      resources,
    });

    await user.updateOne({
      $push: {
        appointments: appointment._id,
      },
    });

    await shopOwner.updateOne({
      $push: {
        appointments: appointment._id,
      },
    });

    // Sending Notification Logic

    const providerNotification = await Notifications.create({
      userId: shopOwnerId,
      notiType: PET_ADOPTION,
      notiTitle: "New Appointment",
      message: `You have a new pet adoption appointment request on ${moment(
        appointmentDate
      ).format("LL")} from ${clientDetails?.firstName} ${
        clientDetails?.lastName
      }. `,
      resource: {
        appointmentId: appointment._id,
      },
    });

    await shopOwner.updateOne({
      $push: {
        notifications: providerNotification._id,
      },
    });

    const notiData = {
      title: providerNotification.notiTitle,
      message: providerNotification.message,
      resource: providerNotification.resource,
      type: providerNotification.notiType,
    };

    // Emit notifications in real-time
    sendNotification(shopOwnerId, notiData);

    res
      .status(200)
      .json({ success: true, message: "Appointment scheduled successfully" });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching orders",
    });
  }
};

const getShopAppointmentDetails = async (req, res, next) => {
  try {
    const { shopId } = req.query;

    const shopOwner = await ShopOwner.findById(shopId);
    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "No shopOwner found",
      });

    const appointments = await Appointments.find({
      shopRecieverId: shopId,
    })
      .populate({
        path: "resources",
        populate: {
          path: "petId",
        },
      })
      .sort({ appointmentDate: 1 });

    if (!appointments || appointments.length === 0)
      return res.status(400).json({
        success: false,
        message: "No appointments found",
      });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const getPetDoctorAppointments = async (req, res, next) => {
  try {
    const { doctorId } = req.query;

    const doctor = await PetDoctors.findById(doctorId);
    if (!doctor)
      return res.status(400).json({
        success: false,
        message: "No doctor found",
      });

    const appointments = await Appointments.find({
      doctorId: doctorId,
    })
      .populate("doctorId")
      .sort({ appointmentDate: 1 });

    if (!appointments || appointments.length === 0)
      return res.status(400).json({
        success: false,
        message: "No appointments found",
      });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const getUserpAppointmentDetails = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const appointments = await Appointments.find({
      clientId: userId,
      isScheduled: true,
    })
      .populate({
        path: "resources",
        populate: {
          path: "petId",
        },
      })
      .populate({
        path: "shopRecieverId",
        select: "shopName shopAddress phone",
      })
      .populate("doctorId")
      .sort({ appointmentDate: 1 });

    if (!appointments || appointments.length === 0)
      return res.status(400).json({
        success: false,
        message: "No appointments found",
      });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const acceptAppointment = async (req, res, next) => {
  try {
    const { appointmentId, clientId, appointmentDate } = req.body;

    const appointment = await Appointments.findById(appointmentId);

    if (!appointment)
      return res.status(400).json({
        success: false,
        message: "No appointment found",
      });

    const user = await User.findById(clientId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    await appointment.updateOne({
      $set: {
        isScheduled: true,
      },
    });

    // Sending App Notification
    const providerNotification = await Notifications.create({
      userId: clientId,
      notiType: PET_ADOPTION,
      notiTitle: "Appointment Accepted",
      message: `You pet adoption appointment request on ${moment(
        appointmentDate
      ).format("LL")} has been accepted. Check your email for details. `,
    });

    await user.updateOne({
      $push: {
        notifications: providerNotification._id,
      },
    });

    const notiData = {
      title: providerNotification.notiTitle,
      message: providerNotification.message,
      type: providerNotification.notiType,
    };

    sendNotification(clientId, notiData);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const rejectAppointment = async (req, res, next) => {
  try {
    const {
      appointmentId,
      clientEmail,
      clientId,
      clientName,
      shopId,
      subject,
      rejectionReason,
      appointmentDate,
      appointmentTime,
    } = req.body;

    const appointment = await Appointments.findById(appointmentId);

    if (!appointment)
      return res.status(400).json({
        success: false,
        message: "No appointment found",
      });

    const user = await User.findById(clientId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    await user.updateOne({
      $pull: {
        appointments: appointmentId,
      },
    });

    if (shopId) {
      const shop = await ShopOwner.findById(shopId);
      if (!shop) {
        return res.status(400).json({
          success: false,
          message: "No shop found",
        });
      }

      await shop.updateOne({
        $pull: {
          appointments: appointmentId,
        },
      });
    }

    await Appointments.findByIdAndDelete(appointmentId);

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #d9534f;">Appointment Rejection Notice</h2>
        <p>Dear <strong>${clientName}</strong>,</p>

        <p>We regret to inform you that your appointment request has been <strong>rejected</strong>. Below are the details:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Subject:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${moment(
              appointmentDate
            ).format("MMM Do YYYY")}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${moment(
              new Date(appointmentTime)
            ).format("LT")}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason for Rejection:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #d9534f;">${
              rejectionReason || "Not specified"
            }</td>
          </tr>
        </table>

        <p>We apologize for any inconvenience. If you have any questions, please contact us.</p>

        <p>Best regards,</p>
        <p><strong>Your Business Name</strong></p>
      </div>
    `;

    // Sending Email
    // await resend.emails.send({
    //   from: process.env.SENDER_EMAIL, // Use the email you verified in Resend
    //   to: clientEmail,
    //   subject: "Appointment Rejected",
    //   html: emailHTML,
    // });

    // Sending App Notification
    const providerNotification = await Notifications.create({
      userId: clientId,
      notiType: PET_ADOPTION,
      notiTitle: "Appointment Rejected",
      message: `You pet adoption appointment request on ${moment(
        appointmentDate
      ).format("LL")} has been rejected. Check your email for details. `,
    });

    await user.updateOne({
      $push: {
        notifications: providerNotification._id,
      },
    });

    const notiData = {
      title: providerNotification.notiTitle,
      message: providerNotification.message,
      type: providerNotification.notiType,
    };

    sendNotification(clientId, notiData);

    res
      .status(200)
      .json({ success: true, message: "Appointment rejected successfully." });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const getEventsDetails = async (req, res, next) => {
  try {
    const { role, userId } = req.query;

    if (!role)
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });

    let appointments;

    if (role === "shopOwner") {
      const shopOwner = await ShopOwner.findById(userId);
      if (!shopOwner)
        return res.status(400).json({
          success: false,
          message: "No shopOwner found",
        });

      appointments = await Appointments.find({
        shopRecieverId: userId,
        isScheduled: true,
      }).populate({
        path: "resources",
        populate: {
          path: "petId",
        },
      });
    } else if (role === "petDoctor") {
      const doctor = await PetDoctors.findById(userId);
      if (!doctor)
        return res.status(400).json({
          success: false,
          message: "No doctor found",
        });

      appointments = await Appointments.find({
        doctorId: userId,
        isScheduled: true,
      });
    } else {
      const user = await User.findById(userId);
      if (!user)
        return res.status(400).json({
          success: false,
          message: "No user found",
        });

      appointments = await Appointments.find({
        clientId: userId,
        isScheduled: true,
      })
        .populate({
          path: "resources",
          populate: {
            path: "petId",
          },
        })
        .populate({
          path: "shopRecieverId",
          select: "shopName shopAddress phone",
        }).populate("doctorId");
    }

    if (!appointments || appointments.length === 0)
      return res.status(400).json({
        success: false,
        message: "No appointments found",
      });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const appointmentCompleted = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId)
      return res.status(400).json({
        success: false,
        message: "appointmentId is required",
      });

    const appointment = await Appointments.findById(appointmentId);

    if (!appointment)
      return res.status(404).json({
        success: false,
        message: "No appointment found",
      });

    await appointment.updateOne({
      $set: {
        status: "completed",
      },
    });

    if (appointment?.subject.includes("Adoption")) {
      const totalPetsAdopted = await Appointments.find({
        shopRecieverId: appointment?.shopRecieverId,
        status: "completed",
      })
        .countDocuments()
        .exec();
      console.log(totalPetsAdopted);
      const shop = await ShopOwner.findById(appointment?.shopRecieverId);
      if (shop) {
        await shop.updateOne({
          $set: {
            totalPetsAdopted: totalPetsAdopted,
          },
        });

        // Deleting the adopted pet
        // await ShopPets.findByIdAndDelete(appointment?.resources?.petId)
      }
    }

    // UPdating Shop Owners Pet Adoption Count

    res
      .status(200)
      .json({ success: true, message: "Appointment marked as completed" });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

const appointmentFailed = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId)
      return res.status(400).json({
        success: false,
        message: "appointmentId is required",
      });

    const appointment = await Appointments.findById(appointmentId);

    if (!appointment)
      return res.status(404).json({
        success: false,
        message: "No appointment found",
      });

    await appointment.updateOne({
      $set: {
        status: "failed",
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Appointment marked as failed" });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching appointments",
    });
  }
};

export {
  createShopAppointment,
  getShopAppointmentDetails,
  acceptAppointment,
  rejectAppointment,
  getUserpAppointmentDetails,
  getEventsDetails,
  appointmentCompleted,
  appointmentFailed,
  getPetDoctorAppointments,
};
