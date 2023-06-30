const { MAILER } = require("../config");

async function sendEmail(mailFrom, mailTo, subject, text) {
  try {
    const response = await MAILER.sendMail({
      from: mailFrom,
      to: mailTo,
      subject: subject,
      text: text,
    });
    return response;
  } catch (error) {
    throw new AppError(
      "Sorry! The mail was not sent successfully. Notification Service is down!",
      StatusCodes.INTERNAL_SERVER_ERROR
    ); // Or else send server-related status code
  }
}

module.exports = {
  sendEmail,
};
