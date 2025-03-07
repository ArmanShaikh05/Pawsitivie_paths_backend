import { CHAT_DELETED } from "../data/constants.js";
import { UploadMessageMedia } from "../middlewares/cloudinary.js";
import { Conversations } from "../models/conversationsModel.js";
import { Messages } from "../models/messagesModel.js";
import { Notifications } from "../models/notificationsModel.js";
import { User } from "../models/userModels.js";
import { sendNotification, sendRealTimeMessage } from "../socket/socketManager.js";
import { v2 as cloudinary } from "cloudinary";

const createConversation = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    const user1 = await User.findById(userIds[0]);
    const user2 = await User.findById(userIds[1]);

    if (!user1 || !user2) {
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }

    // CHECK IF A CONVERSATION ALREADY EXISTS
    const existingConversation = await Conversations.findOne({
      users: { $all: [user1._id, user2._id] },
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: existingConversation,
      });
    }

    // IF NO EXISTING CONVERSATION THEN CREATE NEW ONE

    const conversation = await Conversations.create({
      users: [user1._id, user2._id],
      messages: [],
    });

    if (!conversation) {
      return res.status(400).json({
        success: false,
        message: "Failed to create conversation",
      });
    }

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllConversation = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }

    const conversations = await Conversations.find({
      users: { $in: [user._id] },
    })
      .populate("users")
      .populate("messages");

    if (!conversations) {
      return res.status(400).json({
        success: false,
        message: "No conversations",
      });
    }

    res.status(201).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSingleConversation = async (req, res, next) => {
  try {
    const { chatId } = req.query;

    const chat = await Conversations.findById(chatId)
      .populate("users")
      .populate("messages")
      .exec();

    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "chat not found" });
    }

    res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, senderId, recieverId, message } = req.body;
    const file = req.file;

    const sender = await User.findById(senderId);
    const reciever = await User.findById(recieverId);

    if (!sender || !reciever) {
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }

    let media;

    if (file) {
      const folderName = conversationId;
      const response = await UploadMessageMedia(file.path, folderName);
      media = {
        url: response.secure_url,
        public_id: response.public_id,
      };
    }

    const createdMessage = await Messages.create({
      sender: senderId,
      receiver: recieverId,
      conversationId: conversationId,
      text: message,
      media: media,
    });

    await Conversations.findByIdAndUpdate(conversationId, {
      $push: {
        messages: createdMessage._id,
      },
    });

    sendRealTimeMessage(recieverId, createdMessage);
    sendRealTimeMessage(senderId, createdMessage);

    res.status(201).json({
      success: true,
      message: "Message sent succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteChat = async (req, res, next) => {
  try {
    const { conversationId,friendId,senderId } = req.body;

    const friend = await User.findById(friendId);
    const sender = await User.findById(senderId);

    if (!friend) {
      return res.status(400).json({ message: "No friend found" });
    }

    if (!sender) {
      return res.status(400).json({ message: "No sender found" });
    }


    const conversation = await Conversations.findById(conversationId);

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

    const providerNotification = await Notifications.create({
      userId: friendId,
      notiType: CHAT_DELETED,
      notiTitle: "Chat has been deleted",
      message: `You chatting with ${sender?.userName} has been deleted by them. `,
      avatar: sender?.profilePic?.url,
      senderName: sender?.userName,
    });

    await friend.updateOne({
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

    sendNotification(friendId, notiData);

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
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
  createConversation,
  getAllConversation,
  getSingleConversation,
  sendMessage,
  deleteChat,
};
