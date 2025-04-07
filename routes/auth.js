const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { sendVerificationEmail, sendResetEmail } = require("../utils/email");
const { google } = require("googleapis");

// === Google OAuth Setup ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

// === REGISTER ===
router.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;

  if (!name || !email || !password || !company) {
    return res.status(400).json({ msg: "Please fill in all fields." });
  }

  try {
    const existing = await User.findOne({ email: email.trim() });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password.trim(), 10);
    const user = new User({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      password: hash,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await sendVerificationEmail(user.email, token);

    res.status(201).json({ msg: "User created. Please check your email to verify your account." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error during registration." });
  }
});

// === LOGIN ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ msg: "Incorrect password" });

    if (!user.emailVerified) {
      return res.status(403).json({ msg: "Please verify your email first" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login" });
  }
});

// === FORGOT PASSWORD ===
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(404).json({ msg: "User not found." });

    if (!user.password) {
      return res.status(403).json({ msg: "Password reset is only available for manually created accounts." });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    await sendResetEmail(user.email, token);

    res.status(200).json({ msg: "Password reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ msg: "Server error." });
  }
});

// === RESET PASSWORD ===
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const hash = await bcrypt.hash(password.trim(), 10);
    await User.findByIdAndUpdate(userId, { password: hash });
    res.status(200).json({ msg: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ msg: "Invalid or expired token." });
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
    res.json(tokens);
  } catch (err) {
    console.error("Google callback error:", err);
    res.status(500).send("Google Auth Failed");
  }
});

// === VERIFY JWT TOKEN (FOR FRONTEND) ===
router.post("/verify-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ userId: decoded.userId });
  } catch {
    res.status(403).json({ msg: "Invalid or expired token" });
  }
});

module.exports = router;
