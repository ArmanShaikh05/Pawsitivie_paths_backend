import { UploadProfilePic } from "../middlewares/cloudinary.js";
import { PetDoctors } from "../models/petDoctorModel.js";

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
    const doctor = await PetDoctors.findOne({ uid }).populate("notifications");

    if (!doctor)
      return res.status(400).json({
        success: false,
        message: "doctor not found",
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
      email:email || "",
      userId,
      address:address || "",
      bio:bio || "",
      phone:mobileNumber,
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

    const updatedPetDoctor = await PetDoctors.findById(id)

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
