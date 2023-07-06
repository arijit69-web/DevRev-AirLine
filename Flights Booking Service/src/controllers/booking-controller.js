const { StatusCodes } = require("http-status-codes");
const { BookingService } = require("../services");
const { SuccessResponse, ErrorResponse } = require("../utils/common");

const inMemDb = {};

async function createBooking(req, res) {
  try {
    const response = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.headers["user-id"],
      noOfSeats: req.body.noOfSeats,
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}
async function makePayment(req, res) {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"]; // req.headers -> An object containing the predefined/custom header given in the current request.
    if (!idempotencyKey) {
      ErrorResponse.error = "The IDEMPOTENCY KEY is missing";
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if (inMemDb[idempotencyKey]) {
      ErrorResponse.error = "Cannot retry the request on a Successful Payment";
      return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    const response = await BookingService.makePayment({
      userId: req.headers["user-id"],
      bookingId: req.body.bookingId,
      name: req.body.name,
      card_ExpYear: req.body.card_ExpYear,
      card_ExpMonth: req.body.card_ExpMonth,
      card_Number: req.body.card_Number,
      card_CVC: req.body.card_CVC,
      userEmail: req.headers["user-email"],
    });
    inMemDb[idempotencyKey] = idempotencyKey;
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}
async function getAllFlights(req, res) {
  try {
    const response = await BookingService.getAllFlights(req.query);
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}
async function getBookings(req, res) {
  try {
    const response = await BookingService.getBookings({
      userId: req.headers["user-id"],
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}
async function cancelBookingRequest(req, res) {
  try {
    const response = await BookingService.cancelBookingRequest({
      bookingId: req.body.bookingId,
      name: req.body.name,
      phoneNo: req.body.phoneNo,
      accountNo: req.body.accountNo,
      ifsc: req.body.ifsc,
      userEmail: req.headers["user-email"],
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}

module.exports = {
  createBooking,
  makePayment,
  getAllFlights,
  getBookings,
  cancelBookingRequest,
};
