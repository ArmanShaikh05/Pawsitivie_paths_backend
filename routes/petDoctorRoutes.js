import express from "express";
import { checkPetDoctorUserIdAvailable, createNewDoctor, editDoctorDetails, getDoctorDetails } from "../controllers/petDoctorControllers.js";
import { uploadMiddleware } from "../middlewares/multer.js";

const router = express.Router();

router.post("/create-doctor", createNewDoctor);
router.get("/get-doctor-details/:uid",getDoctorDetails)
router.post("/edit-doctor-details",uploadMiddleware.single("file"),editDoctorDetails)
router.get("/check-userid", checkPetDoctorUserIdAvailable);

export default router;
