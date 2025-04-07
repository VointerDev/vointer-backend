const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/email");

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

// === REGISTER ===
router.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;

  const trimmedName = name.trim();
  const trimmedCompany = company.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedName || !trimmedCompany || !trimmedEmail || !trimmedPassword) {
    return res.status(400).json({ msg: "Please fill in all fields." });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(trimmedPassword, 10);
    const user = new User({
      name: trimmedName,
      company: trimmedCompany,
      email: trimmedEmail,
      password: hash
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await sendVerificationEmail(email, token);

    res.status(201).json({ msg: "User created. Please check your email to verify your account." });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error during registration." });
  }
});

// === EMAIL VERIFICATION ===
router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(userId, { emailVerified: true });
    res.status(200).send("Verified");
  } catch {
    res.status(400).send("Invalid or expired token.");
  }
});

// === GOOGLE OAUTH REDIRECT ===
router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

// === GOOGLE OAUTH CALLBACK ===
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // For now, just show tokens in JSON
    res.json(tokens);

    // ❗ Vill du spara tokens till en användare?
    // const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    // await User.findByIdAndUpdate(decoded.userId, { googleTokens: tokens });

  } catch (err) {
    console.error("Google callback error:", err);
    res.status(500).send("Google Auth Failed");
  }
});

module.exports = router;
