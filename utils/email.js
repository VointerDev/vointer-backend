// utils/email.js
const nodemailer = require("nodemailer");

const sendVerificationEmail = (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Or another provider
    auth: {
      user: process.env.EMAIL_USER, // Use your email
      pass: process.env.EMAIL_PASS, // Use your email password or app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email Address",
    text: `Click this link to verify your account: ${process.env.BASE_URL}/verify?token=${token}`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
