import { v2 as cloudinary } from "cloudinary";
import {
  UploadShopImages,
  UploadShopPetImages,
} from "../middlewares/cloudinary.js";
import { ShopOwner } from "../models/shopOwnerModel.js";
import { ShopPets } from "../models/shopPetsModel.js";
import { Appointments } from "../models/appointmentModel.js";
import mongoose from "mongoose";

const createNewShop = async (req, res, next) => {
  try {
    const { email, userName, uid, role, userId, shopName } = req.body;

    const user = await ShopOwner.create({
      shopEmail: email,
      userName,
      uid,
      role,
      userId,
      shopName,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getShopDetails = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const shop = await ShopOwner.findOne({ uid })
      .populate("shopPets")
      .populate("notifications");

    if (!shop)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getShopDetailsByUserId = async (req, res, next) => {
  try {
    const { shopId } = req.query;
    const shop = await ShopOwner.findOne({ userId: shopId })
      .populate("shopPets")
      .populate("shopProducts");

    if (!shop)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const editShopDetails = async (req, res, next) => {
  try {
    const files = req.files;

    const {
      shopName,
      shopEmail,
      shopAddress,
      shopContact,
      userId,
      shopDescription,
      shopTags,
      weekdayTimings,
      weekendTimings,
      sundayClosed,
      removedImagePublicIds,
      uid,
      userName,
      facebookLink,
      instagramLink,
      twitterLink,
      whatsappLink,
    } = req.body;

    const paresedweekdayTimings = JSON.parse(weekdayTimings);
    const paresedweekendTimings = JSON.parse(weekendTimings);

    const shopOwner = await ShopOwner.findOne({ uid });
    let shopImages = [];

    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "shopOwner not found",
      });

    if (removedImagePublicIds) {
      // LOGIC TO REMOVE IMAGES
      const promiseArray = [];
      removedImagePublicIds.forEach((public_id) => {
        let promise = cloudinary.uploader.destroy(public_id);
        promiseArray.push(promise);
      });
      await Promise.all(promiseArray);

      await shopOwner.updateOne({
        $pull: {
          shopImages: { public_id: { $in: removedImagePublicIds } },
        },
      });
    }

    if (files && files.length > 0) {
      const uploadImagesPromise = [];
      files.forEach((img) => {
        let promise = UploadShopImages(img.path, uid);
        uploadImagesPromise.push(promise);
      });
      const responses = await Promise.all(uploadImagesPromise);
      responses.forEach((response) => {
        shopImages.push({
          url: response?.secure_url,
          public_id: response?.public_id,
        });
      });
    }

    // Adding to Database
    await shopOwner.updateOne({
      shopName,
      shopEmail,
      shopAddress,
      phone: shopContact,
      userId,
      shopDescription,
      userName,
      tags: shopTags,
      shopTimmings: {
        weekdays: paresedweekdayTimings,
        weekend: paresedweekendTimings,
        sundayClosed,
      },
      $push: {
        shopImages: shopImages,
      },
      socialHandles: {
        instagram: instagramLink,
        facebook: facebookLink,
        twitter: twitterLink,
        whatsapp: whatsappLink,
      },
    });

    const updatedShopOwner = await ShopOwner.findOne({ uid }).populate(
      "shopPets"
    );

    res.status(200).json({
      success: true,
      message: "Shop Updated Successfully",
      data: updatedShopOwner,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const addShopPet = async (req, res, next) => {
  try {
    const files = req.files;

    const {
      petName,
      petGender,
      petSize,
      petBreed,
      petAge,
      petColor,
      petLocation,
      isVaccinated,
      isDewormed,
      petPrice,
      petCategory,
      shopOwnerId,
      petDescription,
    } = req.body;

    const shopOwner = await ShopOwner.findById(shopOwnerId);
    let petImgagesArray = [];

    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "shopOwner not found",
      });

    // Adding to Database
    const shopPet = await ShopPets.create({
      petName,
      petAge,
      petPrice,
      petGender,
      petSize,
      petBreed,
      petColor,
      petCategory,
      petLocation,
      isVaccinated,
      isDewormed,
      petDescription,
    });

    if (files && files.length > 0) {
      const uploadImagesPromise = [];
      files.forEach((img) => {
        let promise = UploadShopPetImages(
          img.path,
          `${shopOwner?.uid}/${shopPet?._id}`
        );
        uploadImagesPromise.push(promise);
      });
      const responses = await Promise.all(uploadImagesPromise);
      responses.forEach((response) => {
        petImgagesArray.push({
          url: response?.secure_url,
          public_id: response?.public_id,
        });
      });

      await shopPet.updateOne({
        petImages: petImgagesArray,
      });
    }

    await shopOwner.updateOne({ $push: { shopPets: shopPet._id } });

    const updatedShopOwner = await ShopOwner.findById(shopOwnerId);

    res.status(200).json({
      success: true,
      message: "Pet Added Successfully",
      data: updatedShopOwner,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const getShopChartData = async (req, res, next) => {
  try {
    const { shopId } = req.query;
    const shopOwner = await ShopOwner.findById(shopId)
      .populate({
        path: "shopProducts",
        populate: {
          path: "reviews",
        },
      })
      .populate({
        path: "shopPets",
        populate: {
          path: "reviews",
        },
      });

    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "No shop found",
      });

    const productCategoriesData = {
      petFood: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "petFood"
      ).length,
      grooming: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "grooming"
      ).length,
      toys: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "toys"
      ).length,
      bedding: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "bedding"
      ).length,
      healthcare: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "healthcare"
      ).length,
      clothing: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "clothing"
      ).length,
      accessories: shopOwner.shopProducts.filter(
        (product) => product.productCategory === "accessories"
      ).length,
    };

    const petCategoriesData = {
      dogs: shopOwner.shopPets.filter((pet) => pet.petCategory === "dogs")
        .length,
      cats: shopOwner.shopPets.filter((pet) => pet.petCategory === "cats")
        .length,
      fishs: shopOwner.shopPets.filter((pet) => pet.petCategory === "fishs")
        .length,
      birds: shopOwner.shopPets.filter((pet) => pet.petCategory === "birds")
        .length,
      turtles: shopOwner.shopPets.filter((pet) => pet.petCategory === "turtles")
        .length,
      rabbits: shopOwner.shopPets.filter((pet) => pet.petCategory === "rabbits")
        .length,
    };

    // YEARLY PET ADOPTION DATA
    const result = await Appointments.aggregate([
      {
        $match: {
          shopRecieverId: new mongoose.Types.ObjectId(shopId), // Ensure correct type
          status: "completed"
        },
      },
      {
        $addFields: {
          appointmentDateConverted: { $toDate: "$appointmentDate" } // Convert to Date
        }
      },
      {
        $group: {
          _id: { $month: "$appointmentDateConverted" }, // Extract month from converted Date
          appointmentsCompleted: { $sum: 1 }, // Count appointments
        },
      },
      {
        $sort: { "_id": 1 }, // Sort months in order
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
      const monthData = result.find(item => item._id === index + 1);
      return {
        timePeriod: month,
        petsAdopted: monthData ? monthData.appointmentsCompleted : 0 // Default to 0 if no data
      };
    });


    // MONTHLY PET ADOPTION DATA
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; 
    // console.log(currentDate.getMonth() + 1)
    // console.log(new Date(`${year}-${month}-01`))
    // console.log(new Date(`${year}-${month + 1}-01`))
    const monthResults = await Appointments.aggregate([
      {
        $match: {
          shopRecieverId: new mongoose.Types.ObjectId(shopId), // Ensure shopId is an ObjectId
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
            $ceil: { $divide: [{ $dayOfMonth: "$appointmentDateConverted" }, 7] },
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
        $sort: { "_id": 1 }, // Ensure weeks are sorted in order
      },
    ]);
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    // Ensure all weeks are included in the response
    const monthlyPetAdoptionData = weeks.map((week, index) => {
      const weekData = monthResults.find(item => item._id === index + 1);
      return {
        timePeriod: week,
        petsAdopted: weekData ? weekData.completedAppointments : 0 // Default to 0 if no data
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
          shopRecieverId: new mongoose.Types.ObjectId(shopId), // Ensure shopId is an ObjectId
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
      productCategoriesData,
      petCategoriesData,
      yearlyPetAdoptedData,
      monthlyPetAdoptionData,
      weeklyPetAdoptionData
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export {
  createNewShop,
  editShopDetails,
  getShopDetails,
  getShopDetailsByUserId,
  addShopPet,
  getShopChartData,
};
