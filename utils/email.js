const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);


// Initialize Resend correctly
const resend = new Resend(process.env.RESEND_API_KEY);  // Using the constructor

const sendVerificationEmail = async (email, token) => {
  try {
    const response = await resend.sendEmail({
      from: 'support@vointer.com',  // Replace with your "from" email address
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <p>Click the link below to verify your email:</p>
        <a href="${process.env.BASE_URL}/verify?token=${token}">Verify Email</a>
      `,
    });

    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;  // If something goes wrong, we will throw an error
  }
};

module.exports = { sendVerificationEmail };
