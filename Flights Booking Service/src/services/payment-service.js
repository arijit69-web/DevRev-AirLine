const { ServerConfig } = require("../config");
const stripe = require("stripe")(ServerConfig.STRIPE_SECRET_KEY);
const AppError = require("../utils/errors/app-error");

async function createNewCustomer(data) {
  try {
    const customer = await stripe.customers.create({
      name: data.name,
      email: data.userEmail,
    });
    return customer;
  } catch (error) {
    if (error.type == "StripeCardError") {
      throw new AppError(error.raw.message, error.raw.statusCode);
    }
    throw new AppError(
      "Failed to create a new Customer. Stripe Payment Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function addNewCard(data) {
  try {
    const card_Token = await stripe.tokens.create({
      card: {
        name: data.name,
        number: data.card_Number,
        exp_month: data.card_ExpMonth,
        exp_year: data.card_ExpYear,
        cvc: data.card_CVC,
      },
    });

    const card = await stripe.customers.createSource(data.customer_Id, {
      source: `${card_Token.id}`,
    });

    return card;
  } catch (error) {
    if (error.type == "StripeCardError") {
      throw new AppError(error.raw.message, error.raw.statusCode);
    }
    throw new AppError(
      "Failed to create a new Card. Stripe Payment Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
async function createCharges(data) {
  try {
    const createCharge = await stripe.charges.create({
      amount: data.totalCost * 100, //USD*100
      currency: "inr",
      card: data.card_Id,
      customer: data.customer_Id,
      description: "Flight Booking Payment Receipt | DevRev-AirLine",
    });
    return createCharge;
  } catch (error) {
    if (error.type == "StripeCardError") {
      throw new AppError(error.raw.message, error.raw.statusCode);
    }
    throw new AppError(
      "Payment Failed! Stripe Payment Service is down",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = {
  createNewCustomer,
  addNewCard,
  createCharges,
};
