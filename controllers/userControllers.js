import {
  UploadOwnedPetPic,
  UploadProfilePic,
} from "../middlewares/cloudinary.js";
import ErrorHandler from "../middlewares/error.js";
import { OwnedPets } from "../models/ownedPetsModel.js";
import { Product } from "../models/productModel.js";
import { ShopOwner } from "../models/shopOwnerModel.js";
import { ShopPets } from "../models/shopPetsModel.js";
import { User } from "../models/userModels.js";
import { v2 as cloudinary } from "cloudinary";
import { stripe } from "../server.js";
import { Orders } from "../models/ordersModel.js";
import { FriendRequests } from "../models/friendRequestModel.js";
import { FRIEND_REQUEST } from "../data/constants.js";
import { Notifications } from "../models/notificationsModel.js";
import {
  sendNotification,
  sendRealTimeFriendRequest,
} from "../socket/socketManager.js";
import { Conversations } from "../models/conversationsModel.js";
import { Messages } from "../models/messagesModel.js";

const createNewUser = async (req, res, next) => {
  try {
    const { email, userName, uid, role, userId } = req.body;

    const user = await User.create({
      email,
      userName,
      uid,
      role,
      userId,
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

const getUserDetails = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid })
      .populate("ownedPets")
      .populate("notifications")
      .populate({
        path: "posts",
        populate: {
          path: "userId likedBy",
          select: "profilePic userName userId",
        },
      })
      .populate({
        path: "bookmarkedPosts",
        populate: {
          path: "userId likedBy",
          select: "profilePic userName userId",
        },
      })
      .populate({
        path: "cartItems",
        populate: {
          path: "productId shopId",
        },
      });

    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const friendRequests = await FriendRequests.find({
      $or: [
        { receiverId: user?._id },
        {
          senderId: user?._id,
          status: "accepted",
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: user,
      followingCount: friendRequests?.length,
    });
  } catch (error) {
    res.json({
      success: false,
      // message: error.message,
    });
    // next(new ErrorHandler(error.message, 500));
  }
};

const getUserDetailsById = async (req, res, next) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ userId: id })
      .populate("ownedPets")
      .populate("notifications")
      .populate({
        path: "posts",
        populate: {
          path: "userId likedBy",
          select: "profilePic userName userId",
        },
      })
      .populate({
        path: "bookmarkedPosts",
        populate: {
          path: "userId likedBy",
          select: "profilePic userName userId",
        },
      });

    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const friendRequests = await FriendRequests.find({
      $or: [
        { receiverId: user?._id },
        {
          senderId: user?._id,
          status: "accepted",
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: user,
      followingCount: friendRequests?.length,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const editUser = async (req, res, next) => {
  try {
    const { id } = req.query;
    const file = req.file;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    const user = await User.findById(id);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const { name, DOB, address, bio, favouritePets, mobileNumber, userId } =
      req.body;

    if (file) {
      const folderName = user.userName + "-" + user.uid;
      const { public_id } = user.profilePic;
      if (public_id) {
        cloudinary.uploader.destroy(public_id);
      }
      const response = await UploadProfilePic(file.path, folderName);
      await user.updateOne({
        profilePic: {
          url: response.secure_url,
          public_id: response.public_id,
        },
      });
    }

    await user.updateOne({
      userName: name,
      userId,
      DOB: DOB || "",
      bio: bio || "",
      phone: mobileNumber || "",
      favouritePets: favouritePets || [],
      address: address || "",
    });

    const updatedUser = await User.findById(id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
    next(new ErrorHandler(error.message, 500));
  }
};

const checkUserIdAvailable = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const userIds = await User.find({}, { userId: 1, _id: 0 });

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

const addOwnedPet = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const file = req.file;

    const user = await User.findOne({ userId });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    const { petName, petAge, aboutPet } = req.body;

    if (file) {
      const folderName = user.userName + "-" + user.uid;
      const response = await UploadOwnedPetPic(file.path, folderName);

      const pet = await OwnedPets.create({
        petName,
        petAge,
        petAbout: aboutPet,
        petImg: {
          url: response.secure_url,
          public_id: response.public_id,
        },
      });

      await user.updateOne({
        $push: {
          ownedPets: pet._id,
        },
      });

      res.status(200).json({
        success: true,
        message: "Pet Created Successfully",
        data: user,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Please provide image",
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
    next(new ErrorHandler(error.message, 500));
  }
};

const removeOwnedPet = async (req, res, next) => {
  try {
    const { petId, userId } = req.query;
    const pet = await OwnedPets.findById(petId);
    const user = await User.findOne({ userId });

    if (!pet)
      return res.status(400).json({
        success: false,
        message: "Pet not found",
      });

    if (!user)
      return res.status(400).json({
        success: false,
        message: "User not found",
      });

    await cloudinary.uploader.destroy(pet.petImg.public_id);

    await OwnedPets.findByIdAndDelete(petId);

    await user.updateOne({
      $pull: {
        ownedPets: petId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
    next(new ErrorHandler(error.message, 500));
  }
};

const updateOwnedPet = async (req, res, next) => {
  try {
    const { petName, petAge, petAbout, userName, uid } = req.body;
    const file = req.file;
    const { ownedPetId } = req.query;
    const Pet = await OwnedPets.findById(ownedPetId);
    if (!Pet)
      return res.status(400).json({
        success: false,
        message: "No Pet found",
      });

    if (file) {
      await cloudinary.uploader.destroy(Pet.petImg.public_id);
      const folderName = userName + "-" + uid;
      const response = await UploadOwnedPetPic(file.path, folderName);

      await Pet.updateOne({
        petName,
        petAge,
        petAbout,
        petImg: {
          public_id: response.public_id,
          url: response.secure_url,
        },
      });
    } else {
      await Pet.updateOne({
        petName,
        petAge,
        petAbout,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Pet uploaded successfully",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getShops = async (req, res, next) => {
  try {
    const Shops = await ShopOwner.find().populate("reviews");

    if (!Shops)
      return res.status(400).json({
        success: false,
        message: "No Shops found",
      });

    res.status(200).json({
      success: true,
      data: Shops,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const addPetToWhishlist = async (req, res, next) => {
  try {
    const { userId, petId } = req.query;
    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const pet = await ShopPets.findById(petId);

    if (!pet)
      return res.status(400).json({
        success: false,
        message: "No pet found",
      });

    await user.updateOne({
      $push: {
        whishlistPets: pet._id,
      },
    });

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const removePetFromWhishlist = async (req, res, next) => {
  try {
    const { userId, petId } = req.query;
    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const pet = await ShopPets.findById(petId);

    if (!pet)
      return res.status(400).json({
        success: false,
        message: "No pet found",
      });

    await user.updateOne({
      $pull: {
        whishlistPets: pet._id,
      },
    });

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getWhishlistPetDetails = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId).populate("whishlistPets");

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
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

const addShopToWhishlist = async (req, res, next) => {
  try {
    const { userId, shopId } = req.query;
    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const shop = await ShopOwner.findById(shopId);

    if (!shop)
      return res.status(400).json({
        success: false,
        message: "No shop found",
      });

    await user.updateOne({
      $push: {
        whishlistShops: shop._id,
      },
    });

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const removeShopFromWhishlist = async (req, res, next) => {
  try {
    const { userId, shopId } = req.query;
    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const shop = await ShopOwner.findById(shopId);

    if (!shop)
      return res.status(400).json({
        success: false,
        message: "No shop found",
      });

    await user.updateOne({
      $pull: {
        whishlistShops: shop._id,
      },
    });

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getWhishlistShopDetails = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId).populate("whishlistShops");

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
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

const addProductToWhishlist = async (req, res, next) => {
  try {
    const { userId, productId } = req.query;
    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const product = await Product.findById(productId);

    if (!product)
      return res.status(400).json({
        success: false,
        message: "No product found",
      });

    await user.updateOne({
      $push: {
        whishlistProducts: product._id,
      },
    });

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const removeProductFromWhishlist = async (req, res, next) => {
  try {
    const { userId, productId } = req.query;
    const user = await User.findById(userId);

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    const product = await Product.findById(productId);

    if (!product)
      return res.status(400).json({
        success: false,
        message: "No product found",
      });

    await user.updateOne({
      $pull: {
        whishlistProducts: product._id,
      },
    });

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
};

const getWhishlistProductsDetails = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId).populate("whishlistProducts");

    if (!user)
      return res.status(400).json({
        success: false,
        message: "No user found",
      });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
};

const updateShippingAddress = async (req, res) => {
  try {
    const { userId, address, state, city, pincode } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "No user found",
      });

    user.address = address;
    user.shippingAddress = {
      state,
      city,
      pincode,
    };

    await user.save();

    const userData = await User.findById(userId);

    return res.status(200).json({
      success: true,
      message: "Shipping address updated succesfully",
      data: userData,
    });
  } catch (error) {
    console.log(error);
    return res.statsu(400).json({
      success: false,
      message: "Error updating shipping address",
    });
  }
};

const checkoutCartItems = async (req, res) => {
  try {
    const { products, shippingCharge, discountAmount, taxAmount } = req.body;
    // const lineItems = products.map((product) => ({
    //   price_data: {
    //     currency: "inr",
    //     product_data: {
    //       name: product.productId.productName,
    //       images: [product?.productId?.productImages?.[0]?.url],
    //     },
    //     unit_amount: Math.round(product.productId.productPrice * 100),
    //   },
    //   quantity: product.quantity,
    // }));

    let totalAmount = products.reduce((total, product) => {
      return total + product.productId.productPrice * product.quantity;
    }, 0);

    // Add shipping charge
    if (shippingCharge && Number.parseInt(shippingCharge.slice(1)) > 0) {
      totalAmount += Number(shippingCharge.replace(/[^0-9.-]+/g, ""));
    }

    // Subtract discount amount
    if (discountAmount && discountAmount > 0) {
      totalAmount -= discountAmount;
    }

    if (taxAmount && Number.parseInt(taxAmount.slice(1)) > 0) {
      totalAmount += Number(taxAmount.replace(/[^0-9.-]+/g, ""));
    }

    // Ensure the total is at least 1 (Stripe doesn't allow 0 or negative amounts)
    if (totalAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be at least 1 INR.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Total Payment",
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.FAILURE_URL,
    });

    res.status(200).json({
      success: true,
      message: "Checkout session created",
      sessionId: session.id,
      shippingDetails: {
        shippingCharge,
        discountAmount,
        taxAmount,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error checking out cart items",
    });
  }
};

const emptyCartAfterPayment = async (req, res) => {
  try {
    const { userId, cartItems,shippingDetails } = req.body;

    console.log(shippingDetails)
    // Validate input
    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: userId and cartItems are required",
      });
    }

    // Remove cart items from user's database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.cartItems = [];
    await user.save();

    const productData = [];
    cartItems.forEach((item) =>
      productData.push({
        productId: item.productId._id,
        productQty: item.quantity,
        shopId: item.shopId,
      })
    );
    let amount = 0;
    cartItems.forEach((item) => {
      amount = amount + item.quantity * item.productId.productPrice;
    });

    // Store order details in order database
    await Orders.create({
      userId,
      products: productData,
      amount,
      shippingDetails,
    });

    // Process product updates and shop revenue updates
    const productUpdates = [];
    const shopRevenueUpdates = {};
    const shopSoldProductsUpdates = {};

    for (const item of cartItems) {
      const product = await Product.findById(item.productId._id);
      if (!product) {
        throw new Error(`Product not found: ${item.productId._id}`);
      }

      // Update product quantity
      if (product.productQuantity >= item.quantity) {
        product.productQuantity -= item.quantity;
      } else {
        throw new Error(
          `Not enough quantity of product: ${item.productId._id}`
        );
      }
      productUpdates.push(product.save());

      // Accumulate shop revenue
      const shopId = item.productId.shopOwnerId;
      const revenue = item.quantity * item.productId.productPrice;

      if (!shopRevenueUpdates[shopId]) {
        shopRevenueUpdates[shopId] = revenue;
      } else {
        shopRevenueUpdates[shopId] += revenue;
      }

      if (!shopSoldProductsUpdates[shopId]) {
        shopSoldProductsUpdates[shopId] = item.quantity;
      } else {
        shopSoldProductsUpdates[shopId] += item.quantity;
      }
    }

    // Perform product updates
    await Promise.all(productUpdates);

    // Update shop revenues
    const shopUpdates = Object.entries(shopRevenueUpdates).map(
      async ([shopId, revenue]) => {
        const shop = await ShopOwner.findById(shopId);
        if (!shop) {
          throw new Error(`Shop not found: ${shopId}`);
        }
        shop.shopAnalytics.totalRevenue += revenue;
        return shop.save();
      }
    );

    await Promise.all(shopUpdates);

    // Update shop sold products quantity
    const shopSoldProducts = Object.entries(shopSoldProductsUpdates).map(
      async ([shopId, quantity]) => {
        const shop = await ShopOwner.findById(shopId);
        if (!shop) {
          throw new Error(`Shop not found: ${shopId}`);
        }
        shop.shopAnalytics.totalProducts += quantity;
        return shop.save();
      }
    );

    await Promise.all(shopSoldProducts);

    return res.status(200).json({
      success: true,
      message: "Cart emptied successfully and updates applied.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error emptying cart after payment",
    });
  }
};

const userFromSearch = async (req, res, next) => {
  try {
    const username = req.query.username ? req.query.username : "";

    const users = await User.find(
      {
        userName: {
          $regex: username,
          $options: "i",
        },
      },
      {
        profilePic: 1,
        userName: 1,
      }
    );
    if (!users)
      return res.status(400).json({
        success: false,
        data: {},
        message: "No User Found",
      });

    return res.status(200).json({
      success: true,
      message: "Users Found Successfully",
      data: users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const sendFriendRequest = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: "Sender and receiver IDs are required." });
    }

    const sender = await User.findById(senderId);
    const reciever = await User.findById(receiverId);

    if (!sender) {
      return res.status(400).json({ message: "No sender found" });
    }

    if (!reciever) {
      return res.status(400).json({ message: "No reciever found" });
    }

    const existingRequest = await FriendRequests.findOne({
      senderId: receiverId,
      receiverId: senderId,
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    const friendRequest = new FriendRequests({ senderId, receiverId });
    await friendRequest.save();

    const providerNotification = await Notifications.create({
      userId: receiverId,
      notiType: FRIEND_REQUEST,
      notiTitle: "New friend request",
      message: `You have a new friend request from ${sender?.userName}. `,
      avatar: sender?.profilePic?.url,
      senderName: sender?.userName,
    });

    await reciever.updateOne({
      $push: {
        notifications: providerNotification._id,
      },
    });

    const notiData = {
      title: providerNotification.notiTitle,
      message: providerNotification.message,
      notiType: providerNotification.notiType,
      avatar: sender?.profilePic?.url,
      senderName: sender?.userName,
      newFriendRequest: true,
    };

    sendNotification(receiverId, notiData);
    sendRealTimeFriendRequest(receiverId, notiData);

    res.status(200).json({
      success: true,
      message: "Friend request sent successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const getAllPendingRequestUsers = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }

    const requestsSent = await FriendRequests.find(
      {
        senderId: userId,
        status: "pending",
      },
      { receiverId: 1, _id: 0 }
    );

    const requestsReceived = await FriendRequests.find(
      {
        receiverId: userId,
        status: "pending",
      },
      { senderId: 1, _id: 0 }
    );

    res.status(200).json({
      success: true,
      requestsSent: requestsSent,
      requestsReceived: requestsReceived,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: "Sender and receiver IDs are required." });
    }

    const sender = await User.findById(senderId);
    const reciever = await User.findById(receiverId);

    if (!sender) {
      return res.status(400).json({ message: "No sender found" });
    }

    if (!reciever) {
      return res.status(400).json({ message: "No reciever found" });
    }

    await FriendRequests.updateOne(
      {
        senderId: senderId,
        receiverId: receiverId,
      },
      { $set: { status: "accepted" } }
    );

    await sender.updateOne({
      $push: {
        friends: reciever._id,
      },
    });

    await reciever.updateOne({
      $push: {
        friends: sender._id,
      },
    });

    const providerNotification = await Notifications.create({
      userId: senderId,
      notiType: FRIEND_REQUEST,
      notiTitle: "Friend request accepted",
      message: `${reciever?.userName} accepted your friend request. You both are now friends! `,
      avatar: reciever?.profilePic?.url,
      senderName: reciever?.userName,
    });

    await sender.updateOne({
      $push: {
        notifications: providerNotification._id,
      },
    });

    const notiData = {
      title: providerNotification.notiTitle,
      message: providerNotification.message,
      notiType: providerNotification.notiType,
      avatar: reciever?.profilePic?.url,
      senderName: reciever?.userName,
    };

    sendNotification(senderId, notiData);

    res.status(200).json({
      success: true,
      message: "Friend request accepted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: "Sender and receiver IDs are required." });
    }

    const sender = await User.findById(senderId);
    const reciever = await User.findById(receiverId);

    if (!sender) {
      return res.status(400).json({ message: "No sender found" });
    }

    if (!reciever) {
      return res.status(400).json({ message: "No reciever found" });
    }

    await FriendRequests.deleteOne({
      senderId: senderId,
      receiverId: receiverId,
    });

    const providerNotification = await Notifications.create({
      userId: senderId,
      notiType: FRIEND_REQUEST,
      notiTitle: "Friend request declined",
      message: `${reciever?.userName} rejected your friend request. `,
      avatar: reciever?.profilePic?.url,
      senderName: reciever?.userName,
    });

    await sender.updateOne({
      $push: {
        notifications: providerNotification._id,
      },
    });

    const notiData = {
      title: providerNotification.notiTitle,
      message: providerNotification.message,
      notiType: providerNotification.notiType,
      avatar: reciever?.profilePic?.url,
      senderName: reciever?.userName,
    };

    sendNotification(senderId, notiData);

    res.status(200).json({
      success: true,
      message: "Friend request rejected successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const getAllFriends = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const userFriends = await User.findById(userId, {
      friends: 1,
      _id: 0,
    }).populate("friends");

    if (!userFriends) {
      return res.status(400).json({ message: "No userFriends found" });
    }

    res.status(200).json({
      success: true,
      data: userFriends,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const getAllRecievedRequests = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const requestsReceived = await FriendRequests.find({
      receiverId: userId,
      status: "pending",
    }).populate({
      path: "senderId",
      select: "userName profilePic _id userId",
    });

    res.status(200).json({
      success: true,
      data: requestsReceived,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { friendId, userId } = req.body;

    if (!userId || !friendId) {
      return res
        .status(400)
        .json({ message: "Sender and receiver IDs are required." });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user) {
      return res.status(400).json({ message: "No sender found" });
    }

    if (!friend) {
      return res.status(400).json({ message: "No friend found" });
    }

    await FriendRequests.deleteOne({
      $or: [
        {
          senderId: userId,
          receiverId: friendId,
        },
        {
          senderId: friendId,
          receiverId: userId,
        },
      ],
    });

    await user.updateOne({
      $pull: {
        friends: friendId,
      },
    });

    await friend.updateOne({
      $pull: {
        friends: userId,
      },
    });

    //DELETE CONVERSATION
    const conversation = await Conversations.findOne({
      users: { $all: [userId, friendId] },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Messages.find({ conversationId: conversation._id });

    if (messages && messages.length > 0) {
      let messagePromises = [];

      messages.forEach((message) => {
        if (message.media?.public_id) {
          let promise = cloudinary.uploader.destroy(message.media.public_id);
          messagePromises.push(promise);
        }
      });

      await Promise.all(messagePromises);

      await Messages.deleteMany({ conversationId: conversation._id });
    }

    await Conversations.findByIdAndDelete(conversation._id);

    res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
    });
  }
};

export const checkEmailBeforeLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email is not registered as User",
      });
    }

    res.status(200).json({
      success: true,
      message: "Email is registered as User",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createNewUser,
  getUserDetails,
  getUserDetailsById,
  editUser,
  checkUserIdAvailable,
  addOwnedPet,
  removeOwnedPet,
  updateOwnedPet,
  getShops,
  addPetToWhishlist,
  removePetFromWhishlist,
  getWhishlistPetDetails,
  addShopToWhishlist,
  removeShopFromWhishlist,
  getWhishlistShopDetails,
  addProductToWhishlist,
  removeProductFromWhishlist,
  getWhishlistProductsDetails,
  updateShippingAddress,
  checkoutCartItems,
  emptyCartAfterPayment,
  sendFriendRequest,
  userFromSearch,
  getAllPendingRequestUsers,
  acceptFriendRequest,
  getAllFriends,
  getAllRecievedRequests,
  removeFriend,
  rejectFriendRequest,
};
