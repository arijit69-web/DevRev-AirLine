const express = require("express");

const { BookingController } = require("../../controllers");
const { BookingRequestMiddlewares } = require("../../middlewares");

const router = express.Router();

router.post(
  "/",
  BookingRequestMiddlewares.validateBookingRequest,
  BookingController.createBooking
);
router.get("/", BookingController.getBookings);
router.post(
  "/payment",
  BookingRequestMiddlewares.validatePaymentRequest,
  BookingController.makePayment
);
router.get("/searchFlights", BookingController.getAllFlights);

module.exports = router;
