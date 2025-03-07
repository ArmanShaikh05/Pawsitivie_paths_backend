import { Notifications } from "../models/notificationsModel.js";
import { ShopOwner } from "../models/shopOwnerModel.js";
import { User } from "../models/userModels.js";

export const readNotifications = async (req, res, next) => {
  try {
    const { notiId } = req.query;

    const noti = await Notifications.findById(notiId);
    if (!noti) return next(new ErrorHandler("Notification not found", 404));

    await noti.updateOne({ isRead: true });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
};

export const readAllNotifications = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await Notifications.updateMany(
      { userId },
      { $set: { isRead: true } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No unread notifications found",
      });
    }

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
};

export const deleteReadNotifications = async (req, res, next) => {
  try {
    const { userId, userRole } = req.query;

    let user;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (userRole === "shopOwner") {
      user = await ShopOwner.findById(userId).populate("notifications");
    } else {
      user = await User.findById(userId).populate("notifications");
    }

    const result = await Notifications.deleteMany({ userId, isRead: true });

    const readNotificationIds = user.notifications
      .filter((n) => n.isRead)
      .map((n) => n._id);

    if (readNotificationIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No read notifications found to delete",
      });
    }

    await user.updateOne({
      $pull: { notifications: { $in: readNotificationIds } },
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No read notifications found to delete",
      });
    }

    res.status(200).json({
      success: true,
      message: "All read notifications deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
};
