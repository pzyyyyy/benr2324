require("dotenv").config();
const axios = require("axios");

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

if (!RECAPTCHA_SECRET_KEY) {
  console.error("RECAPTCHA_SECRET_KEY is not defined. Please set it in the environment variables.");
  process.exit(1);
}

async function verifyRecaptcha(token) {
  if (!token) {
    throw new Error("No reCAPTCHA token provided");
  }

  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify`,
    null,
    {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      },
    }
  );

  if (!response.data.success) {
    throw new Error("reCAPTCHA verification failed");
  }
}

module.exports = verifyRecaptcha;