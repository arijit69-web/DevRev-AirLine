const { StatusCodes } = require("http-status-codes");
const { Op } = require("sequelize");
const { Cancel_Booking } = require("../models");
const CrudRepository = require("./crud-repository");
const { Enums } = require("../utils/common");
const { CANCELLED, BOOKED } = Enums.BOOKING_STATUS;
const AppError = require("../utils/errors/app-error");

class CancelBookingRepository extends CrudRepository {
  constructor() {
    super(Cancel_Booking);
  }
  async cancelBooking(data, transaction) {
    const response = await Cancel_Booking.create(data, {
      transaction: transaction,
    });
    return response;
  }
}

module.exports = CancelBookingRepository;
