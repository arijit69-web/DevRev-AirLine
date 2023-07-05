const { StatusCodes } = require("http-status-codes");
const { ErrorResponse } = require("../utils/common");
const AppError = require("../utils/errors/app-error");

function validateBookingRequest(req, res, next) {
  if (!req.body.flightId) {
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Flight ID was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.noOfSeats) {
    ErrorResponse.message = "Failed to authenticate the user";
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
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Booking ID was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.name) {
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Name was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_ExpYear) {
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Card Expiry Year was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_ExpMonth) {
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Card Expiry Month was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_Number) {
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Card Number was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.card_CVC) {
    ErrorResponse.message = "Failed to authenticate the user";
    ErrorResponse.error = new AppError(
      ["The Card CVC was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }

  next();
}
module.exports = {
  validateBookingRequest,
  validatePaymentRequest,
};
