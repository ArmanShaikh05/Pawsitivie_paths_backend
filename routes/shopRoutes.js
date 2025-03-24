import express from "express";
import { addShopPet, checkEmailBeforeLogin, createNewShop, editShopDetails, getShopChartData, getShopDetails, getShopDetailsByUserId, postShopReview } from "../controllers/shopControllers.js";
import { uploadMiddleware } from "../middlewares/multer.js";

const router = express.Router()

router.post("/create-shop", createNewShop);

router.get("/get-details/:uid", getShopDetails);

router.put("/edit-details",uploadMiddleware.array("files",10),editShopDetails)

router.get("/get-details-by-userId", getShopDetailsByUserId)

router.post("/add-pet",uploadMiddleware.array("files",10),addShopPet)

router.get("/chart-details",getShopChartData)

router.post("/post-review",postShopReview)

router.post("/check-email-before-login",checkEmailBeforeLogin)


export default router