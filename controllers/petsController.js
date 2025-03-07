import { UploadShopPetImages } from "../middlewares/cloudinary.js";
import { Review } from "../models/reviewModel.js";
import { ShopOwner } from "../models/shopOwnerModel.js";
import { ShopPets } from "../models/shopPetsModel.js";
import { User } from "../models/userModels.js";
import { v2 as cloudinary } from "cloudinary";

const getPetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shopPet = await ShopPets.findById(id).populate({
      path: "reviews",
      populate: {
        path: "userId",
        select: "profilePic userName",
      },
    });

    if (!shopPet)
      return res.status(400).json({
        success: false,
        message: "Shop Pet not found",
      });

    res.status(200).json({
      success: true,
      data: shopPet,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getAllPets = async (req, res, next) => {
  try {
    const shopPet = await ShopPets.find();

    if (!shopPet)
      return res.status(400).json({
        success: false,
        message: "Shop Pet not found",
      });

    res.status(200).json({
      success: true,
      data: shopPet,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getShopPetsDetails = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const shopPets = await ShopOwner.findById(shopId).populate("shopPets");

    if (!shopPets)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    res.status(200).json({
      success: true,
      data: shopPets,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};

const getPetsByQuery = async (req, res, next) => {
  try {
    const { category, size, color, gender, sort } = req.query;
    const query = {};

    if (category) {
      query.petCategory = category;
    }
    if (size) {
      const sizeArray = size.split(",");
      if (sizeArray.length > 1) {
        query.petSize = { $in: sizeArray };
      } else {
        query.petSize = size;
      }
    }
    if (color) {
      const colorAray = color.split(",");
      if (colorAray.length > 1) {
        query.petColor = { $in: colorAray };
      } else {
        query.petColor = color;
      }
    }
    if (gender) {
      const genderArray = gender.split(",");
      if (genderArray.length > 1) {
        query.petGender = { $in: genderArray };
      } else {
        query.petGender = gender;
      }
    }

    let shopPet = await ShopPets.find(query);

    if (sort === "cheap") {
      shopPet = shopPet.sort((a, b) => a.petPrice - b.petPrice);
    } else if (sort === "expensive") {
      shopPet = shopPet.sort((a, b) => b.petPrice - a.petPrice);
    }

    if (!shopPet)
      return res.status(400).json({
        success: false,
        message: "Shop Pet not found",
      });

    res.status(200).json({
      success: true,
      data: shopPet,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const editPetDetails = async (req, res, next) => {
  try {
    const files = req.files;

    const { shopOwnerId, petId } = req.query;

    const {
      removedImagePublicIds,
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
      petDescription,
    } = req.body;

    console.log(shopOwnerId);

    const shopOwner = await ShopOwner.findById(shopOwnerId);
    const pet = await ShopPets.findById(petId);
    let petImgagesArray = [];

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

      await pet.updateOne({
        $pull: {
          petImages: { public_id: { $in: removedImagePublicIds } },
        },
      });
    }

    if (files && files.length > 0) {
      const uploadImagesPromise = [];
      files.forEach((img) => {
        let promise = UploadShopPetImages(
          img.path,
          `${shopOwner?.uid}/${petId}`
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
    }

    // Adding to Database
    await pet.updateOne({
      petName,
      petAge,
      petPrice,
      petGender,
      petSize,
      petBreed,
      petColor,
      petCategory,
      petLocation,
      $push: {
        petImages: petImgagesArray,
      },
      isVaccinated,
      isDewormed,
      petDescription,
    });

    const updatedShopOwner = await ShopOwner.findById(shopOwnerId).populate(
      "shopPets"
    );

    res.status(200).json({
      success: true,
      message: "Pet Updated Successfully",
      data: updatedShopOwner,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const postPetReview = async (req, res, next) => {
  try {
    const { userId, petId, rating, reviewTitle, reviewDesc, review } = req.body;

    const user = User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const pet = ShopPets.findById(petId);
    if (!pet)
      return res.status(400).json({
        success: false,
        message: "pet not found",
      });

    const newReview = await Review.create({
      title: reviewTitle,
      description: reviewDesc,
      review,
      rating,
      userId,
    });

    await pet.updateOne({
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

const getPetReviewDetails = async (req, res, next) => {
  try {
    const { sort, petId } = req.query;
    let pet = await ShopPets.findById(petId).populate({
      path: "reviews",
      populate: {
        path: "userId",
        select: "profilePic userName",
      },
    });
    if (!pet)
      return res.status(400).json({
        success: false,
        message: "pet not found",
      });

    let reviews = [...pet.reviews];

    if (sort === "negative") {
      reviews.sort((a, b) => a.rating - b.rating); // Sort by lowest rating first
    } else if (sort === "positive") {
      reviews.sort((a, b) => b.rating - a.rating); // Sort by highest rating first
    }

    const chartData = {
      very_bad: pet.reviews.filter((review) => review.rating === 1).length,
      bad: pet.reviews.filter((review) => review.rating === 2).length,
      good: pet.reviews.filter((review) => review.rating === 3).length,
      very_good: pet.reviews.filter((review) => review.rating === 4).length,
      excellent: pet.reviews.filter((review) => review.rating === 5).length,
    };

    res.status(200).json({
      success: true,
      data: reviews,
      chartData: chartData,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const removePet = async (req, res, next) => {
  try {
    const { petId, shopId } = req.query;

    const pet = await ShopPets.findById(petId);
    if (!pet)
      return res.status(400).json({
        success: false,
        message: "Pet not found",
      });

    const shop = await ShopOwner.findById(shopId);
    if (!shop)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    if (pet.petImages) {
      const images = pet.petImages.map((image) => image.public_id);
      const deleteImagesPromiseArray = [];
      images.forEach((id) => {
        deleteImagesPromiseArray.push(cloudinary.uploader.destroy(id));
      });

      await Promise.all(deleteImagesPromiseArray);
    }

    await ShopPets.findByIdAndDelete(petId);

    await shop.updateOne({
      $pull: {
        shopPets: petId,
      },
    });

    const updatedShop = await ShopOwner.findById(shopId);

    res.status(200).json({
      success: true,
      message: "Pet removed successfully",
      data: updatedShop,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const getShopDetailsByPetId = async (req, res, next) => {
  try {
    const { petId } = req.query;

    const pet = await ShopPets.findById(petId);
    if (!pet)
      return res.status(400).json({
        success: false,
        message: "Pet not found",
      });

    const shop = await ShopOwner.findOne({ shopPets: { $in: [petId] } });
    if (!shop)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    const dataToSend = {
      shopId: shop._id,
      shopName: shop.shopName,
      shopLocation: shop.shopAddress,
      shopEmail: shop.shopEmail,
      shopPhoneNo: shop.phone,
      shopTimmings: shop.shopTimmings,
      socialHandles: shop.socialHandles,
    };

    res.status(200).json({
      success: true,
      data: dataToSend,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

export {
  getPetDetails,
  getAllPets,
  getPetsByQuery,
  editPetDetails,
  postPetReview,
  getPetReviewDetails,
  removePet,
  getShopPetsDetails,
  getShopDetailsByPetId,
};
