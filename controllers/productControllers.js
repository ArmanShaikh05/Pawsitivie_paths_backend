import { UploadShopProductImages } from "../middlewares/cloudinary.js";
import { Product } from "../models/productModel.js";
import { Review } from "../models/reviewModel.js";
import { ShopOwner } from "../models/shopOwnerModel.js";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/userModels.js";

const addShopProduct = async (req, res, next) => {
  try {
    const files = req.files;

    const {
      productName,
      productDescription,
      petAge,
      productPrice,
      petType,
      productMaterial,
      availableSizes,
      productCategory,
      productQuantity,
      shopOwnerId,
      shopName,
      productSummary,
    } = req.body;

    const shopOwner = await ShopOwner.findById(shopOwnerId);
    let productImagesArray = [];

    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "shopOwner not found",
      });

    // Adding to Database
    const product = await Product.create({
      productName,
      productDescription,
      petAge,
      productPrice,
      petType,
      productMaterial,
      availableSizes,
      productCategory,
      productQuantity,
      shopName,
      shopOwnerId,
      productSummary,
    });

    if (files && files.length > 0) {
      const uploadImagesPromise = [];
      files.forEach((img) => {
        let promise = UploadShopProductImages(
          img.path,
          `${shopOwner?.uid}/${product?._id}`
        );
        uploadImagesPromise.push(promise);
      });
      const responses = await Promise.all(uploadImagesPromise);
      responses.forEach((response) => {
        productImagesArray.push({
          url: response?.secure_url,
          public_id: response?.public_id,
        });
      });

      await product.updateOne({
        productImages: productImagesArray,
      });
    }

    await shopOwner.updateOne({ $push: { shopProducts: product._id } });

    const updatedShopOwner = await ShopOwner.findById(shopOwnerId);

    res.status(200).json({
      success: true,
      message: "Product Added Successfully",
      data: updatedShopOwner,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const getShopProductDetails = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const shopProducts = await ShopOwner.findById(shopId).populate(
      "shopProducts"
    );

    if (!shopProducts)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    res.status(200).json({
      success: true,
      data: shopProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};

const getProductData = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate({
      path: "reviews",
      populate: {
        path: "userId",
        select: "profilePic userName",
      },
    });

    if (!product)
      return res.status(400).json({
        success: false,
        message: "product not found",
      });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};

const editProductDetails = async (req, res, next) => {
  try {
    const files = req.files;

    const { shopOwnerId, productId } = req.query;

    const {
      removedImagePublicIds,
      productName,
      productDescription,
      petAge,
      productPrice,
      petType,
      productMaterial,
      availableSizes,
      productCategory,
      productQuantity,
      productSummary,
    } = req.body;

    const shopOwner = await ShopOwner.findById(shopOwnerId);
    if (!shopOwner)
      return res.status(400).json({
        success: false,
        message: "shopOwner not found",
      });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(400).json({
        success: false,
        message: "product not found",
      });

    let productImagesArray = [];

    if (removedImagePublicIds) {
      // LOGIC TO REMOVE IMAGES
      const promiseArray = [];
      removedImagePublicIds.forEach((public_id) => {
        let promise = cloudinary.uploader.destroy(public_id);
        promiseArray.push(promise);
      });
      await Promise.all(promiseArray);

      await product.updateOne({
        $pull: {
          productImages: { public_id: { $in: removedImagePublicIds } },
        },
      });
    }

    if (files && files.length > 0) {
      const uploadImagesPromise = [];
      files.forEach((img) => {
        let promise = UploadShopProductImages(
          img.path,
          `${shopOwner?.uid}/${product?._id}`
        );
        uploadImagesPromise.push(promise);
      });
      const responses = await Promise.all(uploadImagesPromise);
      responses.forEach((response) => {
        productImagesArray.push({
          url: response?.secure_url,
          public_id: response?.public_id,
        });
      });
    }

    // Adding to Database
    await product.updateOne({
      productName,
      petAge,
      productDescription,
      productPrice,
      petType,
      productMaterial,
      availableSizes,
      productCategory,
      productQuantity,
      productSummary,
      $push: {
        productImages: productImagesArray,
      },
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

const removeProduct = async (req, res, next) => {
  try {
    const { productId, shopId } = req.query;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(400).json({
        success: false,
        message: "product not found",
      });

    const shop = await ShopOwner.findById(shopId);
    if (!shop)
      return res.status(400).json({
        success: false,
        message: "shop not found",
      });

    if (product.productImages) {
      const images = product.productImages.map((image) => image.public_id);
      const deleteImagesPromiseArray = [];
      images.forEach((id) => {
        deleteImagesPromiseArray.push(cloudinary.uploader.destroy(id));
      });

      await Promise.all(deleteImagesPromiseArray);
    }

    if (product.reviews) {
      const reviewsId = product.reviews.map((review) => review._id);
      const deleteReviewPromiseArray = [];
      reviewsId.forEach((id) => {
        deleteReviewPromiseArray.push(Review.findByIdAndDelete(id));
      });

      await Promise.all(deleteReviewPromiseArray);
    }

    await Product.findByIdAndDelete(productId);

    await shop.updateOne({
      $pull: {
        shopProducts: productId,
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

const getProductsByQuery = async (req, res, next) => {
  try {
    const { category, type, age, material, sort } = req.query;
    const query = {};

    if (category) {
      query.productCategory = category;
    }
    if (type) {
      const petTypeArray = type.split(",");
      if (petTypeArray.length > 1) {
        query.petType = { $in: petTypeArray };
      } else {
        query.petType = type;
      }
    }
    if (age) {
      const petAgeArray = age.split(",");
      if (petAgeArray.length > 1) {
        query.petAge = { $in: petAgeArray };
      } else {
        query.petAge = age;
      }
    }
    if (material) {
      const materialArray = material.split(",");
      if (materialArray.length > 1) {
        query.productMaterial = { $in: materialArray };
      } else {
        query.productMaterial = material;
      }
    }

    let shopProduct = await Product.find(query);

    if (!shopProduct)
      return res.status(400).json({
        success: false,
        message: "Shop Product not found",
      });

    if (sort === "cheap") {
      shopProduct = shopProduct.sort((a, b) => a.productPrice - b.productPrice);
    } else if (sort === "expensive") {
      shopProduct = shopProduct.sort((a, b) => b.productPrice - a.productPrice);
    }

    res.status(200).json({
      success: true,
      data: shopProduct,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const postProductReview = async (req, res, next) => {
  try {
    const { userId, productId, rating, reviewTitle, reviewDesc, review } =
      req.body;

    const user = User.findById(userId);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const product = Product.findById(productId);
    if (!product)
      return res.status(400).json({
        success: false,
        message: "product not found",
      });

    const newReview = await Review.create({
      title: reviewTitle,
      description: reviewDesc,
      review,
      rating,
      userId,
    });

    await product.updateOne({
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

const getProductReviewDetails = async (req, res, next) => {
  try {
    const { sort, productId } = req.query;
    let product = await Product.findById(productId).populate({
      path: "reviews",
      populate: {
        path: "userId",
        select: "profilePic userName",
      },
    });
    if (!product)
      return res.status(400).json({
        success: false,
        message: "product not found",
      });

    let reviews = [...product.reviews];

    if (sort === "negative") {
      reviews.sort((a, b) => a.rating - b.rating); // Sort by lowest rating first
    } else if (sort === "positive") {
      reviews.sort((a, b) => b.rating - a.rating); // Sort by highest rating first
    }

    const chartData = {
      very_bad: product.reviews.filter((review) => review.rating === 1).length,
      bad: product.reviews.filter((review) => review.rating === 2).length,
      good: product.reviews.filter((review) => review.rating === 3).length,
      very_good: product.reviews.filter((review) => review.rating === 4).length,
      excellent: product.reviews.filter((review) => review.rating === 5).length,
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

const addToCart = async (req, res) => {
  try {
    const { quantity, size, productId, userId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let existingItem;

    if (size !== null) {
      existingItem = user.cartItems.find(
        (item) =>
          item.productId.toString() === productId.toString() &&
          item.size === size
      );
    } else {
      existingItem = user.cartItems.find(
        (item) => item.productId.toString() === productId.toString()
      );
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cartItems.push({
        productId,
        quantity,
        size: size || "null",
        shopId: product.shopOwnerId,
      });
    }

    await user.save();

    const userData = await User.findById(userId).populate({
      path: "cartItems",
      populate: {
        path: "productId",
      },
    });

    return res.json({
      success: true,
      message: "Product added to cart",
      data: userData,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error adding to cart",
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, size, action } = req.body;

    // Validate input
    if (!["increase", "decrease"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'increase' or 'decrease'.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let productIndex;

    if (size !== null) {
      productIndex = user.cartItems.findIndex(
        (item) =>
          item?.productId?.toString() === productId?.toString() &&
          item.size === size
      );
    } else {
      productIndex = user.cartItems.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );
    }

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Adjust the quantity based on the action
    if (action === "increase") {
      user.cartItems[productIndex].quantity += 1;
    } else if (action === "decrease") {
      user.cartItems[productIndex].quantity -= 1;

      // Remove item if quantity drops to 0
      if (user.cartItems[productIndex].quantity <= 0) {
        user.cartItems.splice(productIndex, 1);
      }
    }

    // Save the updated user cart
    await user.save();

    const userData = await User.findById(userId).populate({
      path: "cartItems",
      populate: {
        path: "productId",
      },
    });

    return res.status(200).json({
      success: true,
      message: `Product quantity ${action}d successfully`,
      data: userData.cartItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error updating product quantity",
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.updateOne({
      $pull: {
        cartItems: {
          productId: productId,
        },
      },
    });

    const userData = await User.findById(userId).populate({
      path: "cartItems",
      populate: {
        path: "productId",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      data: userData.cartItems,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Error removing to cart",
    });
  }
};

export {
  addShopProduct,
  getShopProductDetails,
  getProductData,
  editProductDetails,
  removeProduct,
  getProductsByQuery,
  postProductReview,
  getProductReviewDetails,
  addToCart,
  updateCartQuantity,
  removeCartItem,
};
