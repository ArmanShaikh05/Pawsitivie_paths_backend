import { Orders } from "../models/ordersModel.js";

const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { "products.shopId": id };

    // Validate and convert startDate
    if (startDate && startDate !== "null" && !isNaN(new Date(startDate))) {
      filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
    }

    // Validate and convert endDate
    if (endDate && endDate !== "null" && !isNaN(new Date(endDate))) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
    }

    // console.log("Filter:", filter); 

    const orders = await Orders.find(filter)
      .populate({
        path: "products",
        populate: {
          path: "productId",
        },
      })
      .populate({
        path: "userId",
        select: "userName shippingAddress profilePic email",
      });

    if (!orders || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No orders found",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching orders",
    });
  }
};


const getUserOrderHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { userId: id };

    // Validate and convert startDate
    if (startDate && startDate !== "null" && !isNaN(new Date(startDate))) {
      filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
    }

    // Validate and convert endDate
    if (endDate && endDate !== "null" && !isNaN(new Date(endDate))) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
    }

    const orders = await Orders.find(filter)
      .populate({
        path: "products",
        populate: {
          path: "productId shopId",
        },
      }).populate("userId")

    if (!orders || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No orders found",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(400).json({
      success: false,
      message: "An error occurred while fetching orders",
    });
  }
};


const getSpecificOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Orders.findById(id)
      .populate({
        path: "products",
        populate: {
          path: "productId",
        },
      })
      .populate({
        path: "userId",
        select: "userName shippingAddress profilePic email",
      });

    if (!order)
      return res.status(400).json({
        success: false,
        message: "No order founc",
      });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
};

const changeDeliveryStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    console.log(status);
    if (!status)
      return res.status(400).json({
        success: false,
        message: "Please provide status",
      });

    const order = await Orders.findById(orderId);

    if (!order)
      return res.status(400).json({
        success: false,
        message: "No order founc",
      });

    await order.updateOne({
      status: status,
    });

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

export { getOrderDetails, getSpecificOrderDetails, changeDeliveryStatus, getUserOrderHistory };
