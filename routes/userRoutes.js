import { Router } from "express";
import {
  acceptFriendRequest,
  addOwnedPet,
  addPetToWhishlist,
  addProductToWhishlist,
  addShopToWhishlist,
  checkoutCartItems,
  checkUserIdAvailable,
  createNewUser,
  editUser,
  emptyCartAfterPayment,
  getAllFriends,
  getAllPendingRequestUsers,
  getAllRecievedRequests,
  getShops,
  getUserDetails,
  getUserDetailsById,
  getWhishlistPetDetails,
  getWhishlistProductsDetails,
  getWhishlistShopDetails,
  rejectFriendRequest,
  removeFriend,
  removeOwnedPet,
  removePetFromWhishlist,
  removeProductFromWhishlist,
  removeShopFromWhishlist,
  sendFriendRequest,
  updateOwnedPet,
  updateShippingAddress,
  userFromSearch,
} from "../controllers/userControllers.js";
import { uploadMiddleware } from "../middlewares/multer.js";

const router = Router();

router.post("/create-user", createNewUser);

router.get("/get-details/:uid", getUserDetails);

router.post("/get-details-by-id", getUserDetailsById);

router.post("/edit-user", uploadMiddleware.single("file"), editUser);

router.get("/check-userid", checkUserIdAvailable);

router.post("/create-owned-pet", uploadMiddleware.single("file"), addOwnedPet);

router.delete("/delete-owned-pet", removeOwnedPet);

router.post("/edit-owned-pet", uploadMiddleware.single("file"), updateOwnedPet);

router.get("/get-shops", getShops);

router.get("/like-pet", addPetToWhishlist);

router.get("/dislike-pet", removePetFromWhishlist);

router.get("/whishlist-pet-details", getWhishlistPetDetails);

router.get("/like-shop", addShopToWhishlist);

router.get("/dislike-shop", removeShopFromWhishlist);

router.get("/like-product", addProductToWhishlist);

router.get("/dislike-product", removeProductFromWhishlist);

router.get("/whishlist-product-details", getWhishlistProductsDetails);

router.get("/whishlist-shop-details", getWhishlistShopDetails);

router.post("/update-shipping-address", updateShippingAddress);

router.post("/checkout", checkoutCartItems);

router.post("/empty-cart", emptyCartAfterPayment);

router.get("/search-user", userFromSearch);

router.post("/send-friend-request", sendFriendRequest);

router.get("/get-pending-requests", getAllPendingRequestUsers);

router.post("/accept-friend-request", acceptFriendRequest);

router.get("/get-all-friends", getAllFriends);

router.get("/get-all-recieved-requests", getAllRecievedRequests);

router.post("/remove-friend", removeFriend);

router.post("/reject-friend-request", rejectFriendRequest);

export default router;
