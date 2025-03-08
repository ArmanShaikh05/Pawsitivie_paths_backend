import express from "express";
import {
  checkPetDoctorUserIdAvailable,
  createNewDoctor,
  createPetDoctorAppointment,
  editDoctorDetails,
  getAllDoctors,
  getDoctorDetails,
  getPetDoctorChartData,
  getSingleDoctorByUserId,
  postDoctorReview,
} from "../controllers/petDoctorControllers.js";
import { uploadMiddleware } from "../middlewares/multer.js";

const router = express.Router();

router.post("/create-doctor", createNewDoctor);
router.get("/get-doctor-details/:uid", getDoctorDetails);
router.post(
  "/edit-doctor-details",
  uploadMiddleware.single("file"),
  editDoctorDetails
);
router.get("/check-userid", checkPetDoctorUserIdAvailable);
router.get("/get-all-doctors", getAllDoctors);
router.get("/get-doctor-detail-by-userId", getSingleDoctorByUserId);
router.post("/create-doctor-appointment", createPetDoctorAppointment);
router.get("/get-doctor-chart-details", getPetDoctorChartData);
router.post("/post-review", postDoctorReview);

export default router;
