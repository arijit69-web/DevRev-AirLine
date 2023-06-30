const { StatusCodes } = require("http-status-codes");
const { Op } = require("sequelize");
const { Booking } = require("../models");
const CrudRepository = require("./crud-repository");
const { Enums } = require("../utils/common");
const { CANCELLED, BOOKED } = Enums.BOOKING_STATUS;
const AppError = require("../utils/errors/app-error");

class BookingRepository extends CrudRepository {
  constructor() {
    super(Booking);
  }
  async createBooking(data, transaction) {
    const response = await Booking.create(data, { transaction: transaction });
    return response;
  }
  async get(data, transaction) {
    // Override the get() function inside the crud-repository
    const response = await Booking.findByPk(data, { transaction: transaction });
    if (!response) {
      throw new AppError(
        "The data for the given ID could not be found",
        StatusCodes.NOT_FOUND
      );
    }
    return response;
  }

  async update(id, data, transaction) {
    // Override the update() function inside the crud-repository

    const response = await Booking.update(
      data,
      {
        where: {
          id: id,
        },
      },
      { transaction: transaction }
    );
    return response;
  }
  async cancelOldBookings(timestamp) {
    const response = await Booking.update(
      { status: CANCELLED },
      {
        where: {
          [Op.and]: [
            {
              createdAt: {
                [Op.lt]: timestamp,
              },
            },
            {
              status: {
                [Op.ne]: BOOKED,
              },
            },
            {
              status: {
                [Op.ne]: CANCELLED,
              },
            },
          ],
        },
      }
    );
    return response;
  }
  async getAll(timestamp) {
    const response = await Booking.findAll({
      where: {
        [Op.and]: [
          {
            createdAt: {
              [Op.lt]: timestamp,
            },
          },
          {
            status: {
              [Op.ne]: BOOKED,
            },
          },
          {
            status: {
              [Op.ne]: CANCELLED,
            },
          },
        ],
      },
    });
    return response;
  }
}

module.exports = BookingRepository;
