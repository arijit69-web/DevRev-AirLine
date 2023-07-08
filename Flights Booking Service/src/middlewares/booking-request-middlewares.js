const { StatusCodes } = require("http-status-codes");
const { ErrorResponse } = require("../utils/common");
const AppError = require("../utils/errors/app-error");
const ifsc = require("ifsc");

function validateBookingRequest(req, res, next) {
  if (!req.body.flightId) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Flight ID was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.noOfSeats) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["Number of Seats were not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  next();
}

function validatePaymentRequest(req, res, next) {
  if (!req.body.bookingId) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Booking ID was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.name) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Name was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_ExpYear) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Card Expiry Year was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_ExpMonth) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Card Expiry Month was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_Number) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Card Number was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_CVC) {
    ErrorResponse.message = "Failed to book the Flight";
    ErrorResponse.error = new AppError(
      ["The Card CVC was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }

  next();
}

function validateCancelBookingRequest(req, res, next) {
  if (!req.body.bookingId) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["The Booking ID was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.name) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["The Name was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.phoneNo) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["The Phone Number was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.accountNo) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["The Account Number was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.ifsc) {
    ErrorResponse.message = "Failed to cancel the Flightr";
    ErrorResponse.error = new AppError(
      ["The IFSC was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  next();
}

function validateCancelBookingDetails(req, res, next) {
  const name = req.body.name;
  const regexName = /^[a-zA-Z\s]+$/;
  if (!regexName.test(name)) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["Please enter your Name correctly"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  const phoneNo = req.body.phoneNo;
  const regexPhoneNumber = /^(\+91|0)?[6789]\d{9}$/;
  if (!regexPhoneNumber.test(phoneNo)) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["Please enter your Phone Number correctly"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  const accountNo = req.body.accountNo;
  const regexAccountNumber = /^[0-9]{9,18}$/;
  if (!regexAccountNumber.test(accountNo)) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["Please enter your Account Number correctly"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  const ifscCode = req.body.ifsc;
  
  if (!ifsc.validate(ifscCode)) {
    ErrorResponse.message = "Failed to cancel the Flight";
    ErrorResponse.error = new AppError(
      ["Please enter your IFSC Code correctly"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  next();
}
module.exports = {
  validateBookingRequest,
  validatePaymentRequest,
  validateCancelBookingRequest,
  validateCancelBookingDetails,
};
