const axios = require("axios");
/*
Axios is a promise-based HTTP library that lets developers make requests to either their own or a third-party server to fetch data. It offers different ways of making requests such as GET , POST , PUT/PATCH , and DELETE .
*/
const { StatusCodes } = require("http-status-codes");
const {
  BookingRepository,
  CancelBookingRepository,
} = require("../repositories");
const { ServerConfig, Queue } = require("../config");
const db = require("../models"); // get the db object that gets returned from the models index file - For Transaction
const AppError = require("../utils/errors/app-error");
const { Enums } = require("../utils/common");
const PaymentService = require("./payment-service");
const { BOOKED, CANCELLED, INITIATED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();
const cancelBookingRepository = new CancelBookingRepository();

async function createBooking(data) {
  /*
 We will be also making one transaction inside the 
 updateRemainingSeats() function in the flight-repository.js  
 because if anyone starts using this function createBooking(data) we wanted to be 
 club inside 1 transaction that either everything goes 
 or nothing goes.
*/
  // This is a Managed Transactions -> committing and rolling back the transaction should be done manually by the user (by calling the appropriate Sequelize methods).
  const transaction = await db.sequelize.transaction(); // Whenever I need to wrap a query within a transaction, I use the transaction object. I can pass the `transaction` object.
  // Wrapping all of these in 1 transaction
  try {
    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
    );
    const flightData = flight.data.data;
    if (data.noOfSeats > flightData.totalSeats) {
      // Is the number of seats we want to book available within the flights?
      throw new AppError(
        "Sorry! Seats are not available",
        StatusCodes.BAD_REQUEST
      );
    }
    const totalBillingAmount = data.noOfSeats * flightData.price;
    const bookingPayload = { ...data, totalCost: totalBillingAmount }; // When users send somethings we have currently userId, noOfSeats, flightId. In order to create a booking we need a totalCost as well so destructuring the object `data` using the spread operator `...data` and then adding one more key-value pair
    const booking = await bookingRepository.createBooking(
      bookingPayload,
      transaction
    ); // This is going to create a new booking for us and will be in an `INITIATED` state and the transaction will reserve the selected number of seats for the current booking for 5 mins for the end users to actually complete the payment, if not completed the payment on time then whatever no. of seats blocked by the transaction for the current booking should be released.
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
      {
        seats: data.noOfSeats, // passing the data inside the req.body
      }
    ); // Booking has been `INITIATED` so reserve noOfSeats in the actual flights or update the seats in the actual flights using patch()

    await transaction.commit(); // If everything goes well do a commit
    return booking;
  } catch (error) {
    await transaction.rollback(); // If we get any error/anything fails above do a rollback
    if (error.code == "ERR_BAD_REQUEST") {
      throw new AppError(
        // error.message, //Overriding the error message thrown from the destroy(id) function inside the crud-repository file
        "There is no flight available for the request you made!",
        400
      );
    }
    if (error.statusCode == StatusCodes.BAD_REQUEST) {
      throw new AppError(
        // error.message, //Overriding the error message thrown from the destroy(id) function inside the crud-repository file
        "Sorry! Seats are not available",
        error.statusCode
      );
    }
    throw new AppError(
      "Sorry! The Booking was not successful. Booking Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function makePayment(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );
    if (bookingDetails.status == BOOKED) {
      throw new AppError(
        "You have already booked your flight! You can't retry the request on a successful Booking ID",
        StatusCodes.BAD_REQUEST
      );
    }
    if (bookingDetails.status == CANCELLED) {
      throw new AppError(
        "Booking session has expired",
        StatusCodes.BAD_REQUEST
      );
    }
    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();

    if (currentTime - bookingTime > 300000) {
      // The transaction will reserve the selected number of seats for the current booking for 5 mins for the end users to actually complete the payment, if not completed the payment on time then whatever no. of seats blocked by the transaction for the current booking should be released.
      await cancelBooking(data.bookingId);
      throw new AppError(
        "Booking session has expired",
        StatusCodes.BAD_REQUEST
      );
    }

    if (bookingDetails.userId != data.userId) {
      throw new AppError(
        "There is no match between the user and the booking",
        StatusCodes.NOT_FOUND
      );
    }

    data.totalCost = bookingDetails.totalCost;
    const newCustomer = await PaymentService.createNewCustomer(data);
    data.customer_Id = newCustomer.id;
    const newCard = await PaymentService.addNewCard(data);
    data.card_Id = newCard.card;
    const paymentCharge = await PaymentService.createCharges(data);

    // we assume here that payment is successful
    const response = await bookingRepository.update(
      data.bookingId,
      { status: BOOKED },
      transaction
    );

    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}`
    );
    const flightData = flight.data.data;
    const flightDepartureTime = new Date(flightData.departureTime);
    const flightArrivalTime = new Date(flightData.arrivalTime);
    Queue.sendData({
      recepientEmail: data.userEmail,
      subject: "Flight Booking Confirmation",
      text: `Dear ${data.name},

We are pleased to inform you that your flight has been successfully booked. We understand the importance of your travel plans, and we are excited to be a part of your journey.
      
Booking Details:
Flight Number: ${flightData.id}
Departure: ${
        flightData.departureAirportId
      } at ${flightDepartureTime.toLocaleString()}
Arrival: ${flightData.arrivalAirportId} at ${flightArrivalTime.toLocaleString()}
     
Passenger Details:
Email: ${data.userEmail}
    
Please note the following important information:
    
1. Flight Itinerary:     
 - Departure: ${
   flightData.departureAirport.City.name
 } on ${flightDepartureTime.toLocaleString()}
 - Arrival: ${
   flightData.arrivalAirport.City.name
 } on ${flightArrivalTime.toLocaleString()}

2. Check-in:    
 - Please arrive at the airport at least 2 Hrs before the scheduled departure time.
 - Carry a valid photo ID for security and check-in purposes.

3. Baggage:
 - Please review the baggage allowance for your flight. Exceeding the permitted limits may incur additional charges.

4. Travel Documents:
 - Ensure that you have all the necessary travel documents, such as a valid passport, visa, or any required identification.

5. Cancellation or Changes:
 - If you need to cancel or make changes to your booking, please contact our customer support team as soon as possible. Applicable fees and conditions may apply.

 We hope you have a pleasant flight experience with us. Should you have any questions or require further assistance, please do not hesitate to contact our customer support team at devrevairline.support@gmail.com.
      
Thank you for choosing our services, and we look forward to serving you.

Best regards,
Dev-Rev AirLine

Please click on the following link to download your payment receipt :
${paymentCharge.receipt_url}
`,
    }); // Queue.sendData() should work asynchronously so no need for `await` here
    await transaction.commit();
    return paymentCharge;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof AppError) throw error;

    throw new AppError(
      "Sorry! The Booking was not successful. Payment Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function cancelBooking(bookingId) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(bookingId, transaction);
    if (bookingDetails.status == CANCELLED) {
      await transaction.commit();
      return true;
    }
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,
      {
        seats: bookingDetails.noOfSeats,
        dec: false,
      }
    );
    await bookingRepository.update(
      bookingId,
      { status: CANCELLED },
      transaction
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error.statusCode == StatusCodes.NOT_FOUND) {
      throw new AppError(
        // error.message, //Overriding the error message thrown from the destroy(id) function inside the crud-repository file
        "For the request you made, there is no bookingId available to cancel!",
        error.statusCode
      );
    }
    throw new AppError(
      "Sorry! The Cancellation was unsuccessful. Cancellation Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
/*
We need to execute the same logic as cancelBooking() after 
every 5-10 mins to check for bookings whose sessions are 
already expired and can never be booked by the respected 
users. So all the seats occupied by those bookings should 
be set free so that other users can book those seats.

The task cancelBooking() must be executed periodically after
a certain interval. We can use a timer using setTimeInterval()
to execute that after every 5-10 minutes. There is a problem
with that if the server is down for some time then those
changes/cancellations were not gonna work.

To handle this kind of case we have CRON JOBS

Cron jobs are scheduled at recurring intervals, specified 
using a format based on unix-cron. You can define a schedule
so that your job runs multiple times a day, or runs on 
specific days and months.

We will use a package called node-cron.

*/
async function cancelOldBookings() {
  const transaction = await db.sequelize.transaction();
  try {
    const time = new Date(Date.now() - 1000 * 300); // new Date object 5 mins ago from now()
    const allBookingDetails = await bookingRepository.getAll(time);
    for (const booking of allBookingDetails) {
      const { flightId, noOfSeats } = booking.dataValues;
      await axios.patch(
        `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${flightId}/seats`,
        {
          seats: noOfSeats,
          dec: false,
        }
      );
    }
    const response = await bookingRepository.cancelOldBookings(time); // Cancel Bookings whose sessions are already expired seats and  occupied by those bookings should be set free
    await transaction.commit();
    return response;
  } catch (error) {
    await transaction.rollback();
    throw new AppError(
      "An error occurred while running the CRON JOB",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function getAllFlights(data) {
  try {
    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/`,
      { params: data }
    );
    return flight.data.data;
  } catch (error) {
    if (error.code == "ERR_BAD_REQUEST") {
      throw new AppError(
        // error.message, //Overriding the error message thrown from the destroy(id) function inside the crud-repository file
        error.response.data.message,
        400
      );
    }

    throw new AppError(
      "Sorry! The Search was not successful. Search Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function getBookings(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const response = await bookingRepository.getBookings(
      data.userId,
      transaction
    );
    for (let key in response) {
      const flightId = response[key].flightId;
      const flight = await axios.get(
        `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${flightId}`
      );
      response[key].dataValues.flight = flight.data.data;
    }
    await transaction.commit();
    return response;
  } catch (error) {
    await transaction.rollback();
    throw new AppError(
      "Sorry! The Booking was not successful. Booking Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function cancelBookingRequest(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );
    if (bookingDetails.status == CANCELLED) {
      throw new AppError(
        "It is not possible to retry the request on a Cancelled Booking",
        StatusCodes.BAD_REQUEST
      );
    }
    if (bookingDetails.status == INITIATED) {
      throw new AppError(
        "There is no way to Cancel the Booking since it has not yet been made",
        StatusCodes.BAD_REQUEST
      );
    }

    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,
      {
        seats: bookingDetails.noOfSeats,
        dec: false,
      }
    );
    await bookingRepository.update(
      data.bookingId,
      { status: CANCELLED },
      transaction
    );
    const cancelBooking = await cancelBookingRepository.cancelBooking(
      data,
      transaction
    );
    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}`
    );
    const flightData = flight.data.data;
    const flightDepartureTime = new Date(flightData.departureTime);

    Queue.sendData({
      recepientEmail: data.userEmail,
      subject: "Flight Cancellation Confirmation",
      text: `Dear ${data.name},

We hope this email finds you well. We would like to confirm that your flight reservation has been successfully canceled as per your request. 

Below are the details of your canceled flight reservation:
      
Passenger Name: ${data.name}
Booking Reference Number: ${data.bookingId}
Flight Number: ${flightData.id}
Departure Date:  ${flightDepartureTime.toLocaleString()}
Departure Airport: ${flightData.departureAirport.name}
Destination Airport:  ${flightData.arrivalAirport.name}

We have processed your cancellation request, and we understand that circumstances can change unexpectedly, leading to the need for a flight cancellation. While we regret that you won't be able to travel with us on the scheduled date, we appreciate your cooperation in informing us promptly.

Regarding your refund, we are pleased to inform you that you are eligible for a refund in accordance with the fare conditions associated with your ticket. Our refund department will initiate the refund process, which may take a few business days to reflect in your account. Please note that the refund amount may be subject to any applicable fees or charges as per the fare rules.

We understand that having a written confirmation of the flight cancellation is essential for your records. Attached to this email, you will find a confirmation document outlining the cancellation details and refund information. Please review it carefully, and if you have any questions or require further clarification, feel free to contact our customer service team at devrevairline.support@gmail.com. They will be more than happy to assist you.

Once again, we apologize for any inconvenience caused by the cancellation. We value your patronage and hope to serve you in the future under more favorable circumstances. If there is anything else we can assist you with, please do not hesitate to reach out to us.

Thank you for choosing Dev-Rev AirLine. We appreciate your understanding and cooperation.

Best regards,
Dev-Rev AirLine

`,
    }); // Queue.sendData() should work asynchronously so no need for `await` here

    await transaction.commit();
    return cancelBooking;
  } catch (error) {
    if (error instanceof AppError) throw error;
    await transaction.rollback();
    if (error.statusCode == StatusCodes.NOT_FOUND) {
      throw new AppError(
        // error.message, //Overriding the error message thrown from the destroy(id) function inside the crud-repository file
        "For the request you made, there is no bookingId available to cancel!",
        error.statusCode
      );
    }
    throw new AppError(
      "Sorry! The Cancellation was unsuccessful. Cancellation Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = {
  createBooking,
  makePayment,
  cancelBooking,
  cancelOldBookings,
  getAllFlights,
  getBookings,
  cancelBookingRequest,
};

// Link for Transactions -> https://sequelize.org/docs/v6/other-topics/transactions/

// Link for JS Destructuring & Spread Operator -> https://www.freecodecamp.org/news/javascript-destructuring-and-spread-operator-explained/
