const Resend = require('resend');  // Import Resend SDK

// Use Resend function directly (no need for 'new' keyword)
const resend = Resend(process.env.RESEND_API_KEY);  // Initialize with API key

// Function to send verification email
const sendVerificationEmail = async (email, token) => {
  try {
    const response = await resend.emails.send({
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

// Export the function so it can be used elsewhere
module.exports = { sendVerificationEmail };
