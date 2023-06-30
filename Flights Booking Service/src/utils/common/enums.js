const SEAT_TYPE = { // SEAT_TYPE object to avoid raw strings in the project as spelling mistakes can also break down your project. 
    BUSINESS: 'business',
    ECONOMY: 'economy',
    PREMIUM_ECONOMY: 'premium-economy',
    FIRST_CLASS: 'first-class'
}

const BOOKING_STATUS = {
    BOOKED: 'booked',
    CANCELLED: 'cancelled',
    INITIATED: 'initiated',
    PENDING: 'pending'
}

module.exports = {
    SEAT_TYPE,
    BOOKING_STATUS
}