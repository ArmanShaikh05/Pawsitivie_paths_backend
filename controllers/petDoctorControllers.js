import moment from "moment";
import { DOCTOR_APPOINTMENT } from "../data/constants.js";
import { UploadProfilePic } from "../middlewares/cloudinary.js";
import { Appointments } from "../models/appointmentModel.js";
import { Notifications } from "../models/notificationsModel.js";
import { PetDoctors } from "../models/petDoctorModel.js";
import { User } from "../models/userModels.js";
import { combineDateTime } from "../utils/feature.js";
import { sendNotification } from "../socket/socketManager.js";
import mongoose from "mongoose";
import { Review } from "../models/reviewModel.js";

export const createNewDoctor = async (req, res, next) => {
  try {
    const { email, userName, uid, role, userId } = req.body;

    const doctor = await PetDoctors.create({
      email,
      userName,
      uid,
      role,
      userId,
    });

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const getDoctorDetails = async (req, res, next) => {
  try {
    const { uid } = req.params;

    const doctor = await PetDoctors.findOne({ uid })
      .populate("notifications")
      .populate("reviews");

    if (!doctor)
      return res.status(400).json({
        success: false,
        message: "doctor not found",
      });

    const appointments = await Appointments.find({
      doctorId: doctor._id,
      status: "completed",
    });

    const pendingAppointments = await Appointments.find({
      doctorId: doctor._id,
      status: "pending",
    });

    await doctor.updateOne({
      $set: {
        totalRevenue: appointments * doctor.appointmentFee || 0,
        completedAppointments: appointments.length || 0,
        pendingAppointments: pendingAppointments.length || 0,
      },
    });

    const updatedDoctor = await PetDoctors.findById(doctor._id);

    res.status(200).json({
      success: true,
      data: updatedDoctor,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const editDoctorDetails = async (req, res, next) => {
  try {
    const { id } = req.query;
    const file = req.file;

    const {
      name,
      email,
      address,
      bio,
      mobileNumber,
      userId,
      weekdayTimings,
      weekendTimings,
      sundayClosed,
      city,
      state,
      pincode,
      appointmentFee,
      availableForWork,
      education,
      speciality,
      facebookLink,
      instagramLink,
      twitterLink,
      whatsappLink,
      experience,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    const paresedweekdayTimings = JSON.parse(weekdayTimings);
    const paresedweekendTimings = JSON.parse(weekendTimings);

    const petDoctor = await PetDoctors.findById(id);

    if (!petDoctor)
      return res.status(400).json({
        success: false,
        message: "petDoctor not found",
      });

    if (file) {
      const folderName = petDoctor.userName + "-" + petDoctor.uid;
      const { public_id } = petDoctor.profilePic;
      if (public_id) {
        cloudinary.uploader.destroy(public_id);
      }
      const response = await UploadProfilePic(file.path, folderName);
      await petDoctor.updateOne({
        profilePic: {
          url: response.secure_url,
          public_id: response.public_id,
        },
      });
    }

    // Adding to Database
    await petDoctor.updateOne({
      userName: name,
      email: email || "",
      userId,
      address: address || "",
      bio: bio || "",
      phone: mobileNumber,
      city,
      state,
      pincode,
      appointmentFee,
      availableForWork,
      education,
      speciality,
      experience,

      availability: {
        weekdays: paresedweekdayTimings,
        weekend: paresedweekendTimings,
        sundayClosed,
      },
      socialHandles: {
        instagram: instagramLink,
        facebook: facebookLink,
        twitter: twitterLink,
        whatsapp: whatsappLink,
      },
    });

    const updatedPetDoctor = await PetDoctors.findById(id);

    res.status(200).json({
      success: true,
      message: "Pet doctor Updated Successfully",
      data: updatedPetDoctor,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const checkPetDoctorUserIdAvailable = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const userIds = await PetDoctors.find({}, { userId: 1, _id: 0 });

    if (userIds.some((user) => user.userId === userId)) {
      return res.status(200).json({
        success: false,
        message: "User ID already exists",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "User ID is available",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllDoctors = async (req, res, next) => {
  try {
    const { speciality } = req.query;
    let basequery = {};
    if (speciality) {
      basequery.speciality = speciality;
    }
    const allDoctors = await PetDoctors.find(basequery);

    res.status(200).json({
      success: true,
      message: "All Doctors Retrieved Successfully",
      data: allDoctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleDoctorByUserId = async (req, res, next) => {
  try {
    const { doctorId } = req.query;
    const doctor = await PetDoctors.findOne({ userId: doctorId }).populate({
      path: "reviews",
      populate: {
        path: "userId",
        select:"profilePic userName"
      },
    });

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "No doctor found",
      });
    }

    const relatedDoctors = await PetDoctors.find({
      speciality: doctor?.speciality,
    });

    res.status(200).json({
      success: true,
      data: doctor,
      relatedDoctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPetDoctorAppointment = async (req, res, next) => {
  try {
    const {
      userId,
      doctorId,
      description,
      startTime,
      endTime,
      clientDetails,
      subject,
      appointmentDate,
    } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const petDoctor = await PetDoctors.findById(doctorId);
    if (!petDoctor)
      return res.status(400).json({
        success: false,
        message: "No petDoctor found",
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
      doctorId: doctorId,
      description: description,
      startTime: combineDateTime(appointmentDate, startTime),
      endTime: combineDateTime(appointmentDate, endTime),
      subject: subject,
      clientDetails: clientDetails,
      appointmentDate: appointmentDate,
    });

    await user.updateOne({
      $push: {
        appointments: appointment._id,
      },
    });

    await petDoctor.updateOne({
      $push: {
        appointments: appointment._id,
      },
    });

    // Sending Notification Logic

    const providerNotification = await Notifications.create({
      userId: doctorId,
      notiType: DOCTOR_APPOINTMENT,
      notiTitle: "New Appointment",
      message: `You have a new patient appointment request on ${moment(
        appointmentDate
      ).format("LL")} from ${clientDetails?.firstName} ${
        clientDetails?.lastName
      }. `,
      resource: {
        appointmentId: appointment._id,
      },
    });

    await petDoctor.updateOne({
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
    sendNotification(doctorId, notiData);

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

export const getPetDoctorChartData = async (req, res, next) => {
  try {
    const { doctorId } = req.query;
    const doctor = await PetDoctors.findById(doctorId);

    if (!doctor)
      return res.status(400).json({
        success: false,
        message: "No doctor found",
      });

    // YEARLY PET ADOPTION DATA
    const result = await Appointments.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId), // Ensure correct type
          status: "completed",
        },
      },
      {
        $addFields: {
          appointmentDateConverted: { $toDate: "$appointmentDate" }, // Convert to Date
        },
      },
      {
        $group: {
          _id: { $month: "$appointmentDateConverted" }, // Extract month from converted Date
          appointmentsCompleted: { $sum: 1 }, // Count appointments
        },
      },
      {
        $sort: { _id: 1 }, // Sort months in order
      },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const yearlyPetAdoptedData = months.map((month, index) => {
      const monthData = result.find((item) => item._id === index + 1);
      return {
        timePeriod: month,
        petsAdopted: monthData ? monthData.appointmentsCompleted : 0, // Default to 0 if no data
      };
    });

    // MONTHLY PET ADOPTION DATA
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const monthResults = await Appointments.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId), // Ensure shopId is an ObjectId
          status: "completed",
        },
      },
      {
        $addFields: {
          appointmentDateConverted: { $toDate: "$appointmentDate" }, // Convert string to Date
        },
      },
      {
        $match: {
          appointmentDateConverted: {
            $gte: new Date(`${year}-${month}-01`), // Start of current month
            $lt: new Date(`${year}-${month + 1}-01`), // Start of next month
          },
        },
      },
      {
        $addFields: {
          weekOfMonth: {
            $ceil: {
              $divide: [{ $dayOfMonth: "$appointmentDateConverted" }, 7],
            },
          },
        },
      },
      {
        $group: {
          _id: "$weekOfMonth", // Group by calculated week of the month
          completedAppointments: { $sum: 1 }, // Count total completed appointments
        },
      },
      {
        $sort: { _id: 1 }, // Ensure weeks are sorted in order
      },
    ]);
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    // Ensure all weeks are included in the response
    const monthlyPetAdoptionData = weeks.map((week, index) => {
      const weekData = monthResults.find((item) => item._id === index + 1);
      return {
        timePeriod: week,
        petsAdopted: weekData ? weekData.completedAppointments : 0, // Default to 0 if no data
      };
    });

    // WEEKLY PET ADOPTION DATA
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Move to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // End of Saturday

    const weeklyPetAdoption = await Appointments.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId), // Ensure shopId is an ObjectId
          status: "completed",
        },
      },

      {
        $addFields: {
          adoptionDateConverted: { $toDate: "$appointmentDate" }, // Convert to Date type
        },
      },

      {
        $match: {
          adoptionDateConverted: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$adoptionDateConverted" }, // Group by day of the week (1 = Sunday, 7 = Saturday)
          petsAdopted: { $sum: 1 }, // Count total adopted pets
        },
      },
      {
        $sort: { _id: 1 }, // Sort by day of the week
      },
    ]);

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Ensure all days (Sun-Sat) appear, even if there are no adoptions on some days
    const weeklyPetAdoptionData = daysOfWeek.map((day, index) => {
      const dayData = weeklyPetAdoption.find((item) => item._id === index + 1);
      return {
        timePeriod: day,
        petsAdopted: dayData ? dayData.petsAdopted : 0, // Default to 0 if no data
      };
    });

    res.status(200).json({
      success: true,
      yearlyPetAdoptedData,
      monthlyPetAdoptionData,
      weeklyPetAdoptionData,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export const postDoctorReview = async (req, res, next) => {
  try {
    const { userId, doctorId, rating, reviewTitle, reviewDesc, review } =
      req.body;

    const user = User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const doctor = PetDoctors.findById(doctorId);
    if (!doctor)
      return res.status(400).json({
        success: false,
        message: "doctor not found",
      });

    const newReview = await Review.create({
      title: reviewTitle,
      description: reviewDesc,
      review,
      rating,
      userId,
      doctorId,
    });

    await doctor.updateOne({
      $push: {
        reviews: newReview._id,
      },
    });

    await user.updateOne({
      $push: {
        reviews: newReview._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Review posted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};
