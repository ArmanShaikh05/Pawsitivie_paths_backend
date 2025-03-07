import express from "express";
import {
  createConversation,
  deleteChat,
  getAllConversation,
  getSingleConversation,
  sendMessage,
} from "../controllers/chattingControllers.js";
import { uploadMiddleware } from "../middlewares/multer.js";

const router = express.Router();

router.post("/create-conversation", createConversation);

router.get("/all-conversations", getAllConversation);

router.get("/single-conversations", getSingleConversation);

router.post("/send-message",uploadMiddleware.single("file"),sendMessage)

router.post("/delete-chat",deleteChat)

export default router;
