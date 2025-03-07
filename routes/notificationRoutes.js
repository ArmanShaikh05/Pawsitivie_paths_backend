import express from "express"
import { deleteReadNotifications, readAllNotifications, readNotifications } from "../controllers/notificationController.js"

const router = express.Router()

router.get("/readNoti",readNotifications)

router.get("/readAllNoti",readAllNotifications)

router.delete("/deleteReadNoti",deleteReadNotifications)




export default router