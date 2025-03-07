import express from "express"
import { changeDeliveryStatus, getOrderDetails, getSpecificOrderDetails, getUserOrderHistory } from "../controllers/ordersControllers.js"
const router = new express.Router()

router.get("/:id",getOrderDetails)

router.get("/order-history/:id",getUserOrderHistory)

router.get("/single/:id",getSpecificOrderDetails)

router.put("/change-status",changeDeliveryStatus)



export default router