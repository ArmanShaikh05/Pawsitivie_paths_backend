import express from "express";
import {
  acceptAppointment,
  appointmentCompleted,
  appointmentFailed,
  createShopAppointment,
  getEventsDetails,
  getShopAppointmentDetails,
  getUserpAppointmentDetails,
  rejectAppointment,
} from "../controllers/appointmentControllers.js";
const router = new express.Router();

router.post("/create-shop-appointment", createShopAppointment);

router.get("/get-shop-appointments", getShopAppointmentDetails);

router.get("/get-user-appointments", getUserpAppointmentDetails);

router.get("/get-user-events", getEventsDetails);

router.put("/accept-appointment", acceptAppointment);

router.post("/reject-appointment", rejectAppointment);

router.put("/appointment-completed", appointmentCompleted);
router.put("/appointment-failed", appointmentFailed);

export default router;
