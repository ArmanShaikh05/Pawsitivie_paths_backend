import express from "express";
import { config } from "dotenv";
import {Resend} from "resend";
import { connectDB } from "./data/database.js";
import cors from "cors";
// import ErrorMiddleware from "./middlewares/error.js"
import { fileURLToPath } from "url";
import { dirname } from "path";
import userRouter from "./routes/userRoutes.js";
import shopRouter from "./routes/shopRoutes.js";
import petsRouter from "./routes/petsRoutes.js";
import productsRouter from "./routes/productRoutes.js";
import ordersRouter from "./routes/orderRoutes.js";
import appointmentRouter from "./routes/appointmentRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import postsRouter from "./routes/postsRoutes.js"
import chattingRouter from "./routes/chattingRoutes.js"
import petDoctorRouter from "./routes/petDoctorRoutes.js"
import OtpRouter from "./routes/otpRoutes.js"
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";
import http from "http";
import { initializeSocket } from "./socket/socketManager.js";

config({
  path: "./data/config.env",
});

const server = express();
const app = http.createServer(server);

connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// USING MIDDLEWARES
server.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use("/uploads", express.static(__dirname + "/uploads"));
// server.use(ErrorMiddleware);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initializing Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

// Initializing Socket
initializeSocket(app);

// USING ROUTES
server.use("/api/v1/user", userRouter);
server.use("/api/v1/shop", shopRouter);
server.use("/api/v1/pets", petsRouter);
server.use("/api/v1/products", productsRouter);
server.use("/api/v1/orders", ordersRouter);
server.use("/api/v1/appointments", appointmentRouter);
server.use("/api/v1/notifications", notificationRouter);
server.use("/api/v1/posts", postsRouter);
server.use("/api/v1/chats", chattingRouter);
server.use("/api/v1/doctor", petDoctorRouter);
server.use("/api/v1/otp", OtpRouter);

server.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
