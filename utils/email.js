const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY); // ✅ Single declaration


const sendVerificationEmail = async (email, token) => {
  try {
    const response = await resend.emails.send({ // ✅ Correct method: resend.emails.send
      from: 'support@vointer.com',
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
    throw error;
  }
};

console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY); // 👀 DEBUG


module.exports = { sendVerificationEmail };
