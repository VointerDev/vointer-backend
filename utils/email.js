const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// === Skicka verifieringsmail ===
const sendVerificationEmail = async (email, token) => {
  const link = `${process.env.BASE_URL}/verify?token=${token}`;
  try {
    const response = await resend.emails.send({
      from: 'lefteris@cercino.se',
      to: email,
      subject: 'Verifiera ditt konto hos Vointer',
      html: `
        <div style="font-family: 'SF Pro Display', sans-serif; padding: 30px;">
          <h2 style="color: #2563eb;">🔐 Välkommen till Vointer</h2>
          <p>Hej! Klicka på knappen nedan för att verifiera din e-postadress.</p>
          <a href="${link}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;">Verifiera e-post</a>
          <p style="margin-top: 30px; font-size: 12px; color: #555;">Om du inte registrerat ett konto kan du ignorera detta mail.</p>
        </div>
      `,
    });
    return response;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
};

// === Skicka återställningsmail ===
const sendResetEmail = async (email, token) => {
  const link = `${process.env.BASE_URL}/reset-password.html?token=${token}`;
  try {
    const response = await resend.emails.send({
      from: 'lefteris@cercino.se',
      to: email,
      subject: 'Återställ ditt lösenord – Vointer',
      html: `
        <div style="font-family: 'SF Pro Display', sans-serif; padding: 30px;">
          <h2 style="color: #10b981;">🔑 Återställ lösenord</h2>
          <p>Du har begärt att återställa ditt lösenord. Klicka på knappen nedan för att fortsätta.</p>
          <a href="${link}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#10b981;color:white;border-radius:8px;text-decoration:none;">Återställ lösenord</a>
          <p style="margin-top: 30px; font-size: 12px; color: #555;">Om du inte begärt detta kan du ignorera mailet.</p>
        </div>
      `,
    });
    return response;
  } catch (error) {
    console.error("❌ Error sending reset email:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
};
