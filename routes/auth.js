const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/email");

router.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;

  // Trim whitespace before saving to DB
  const trimmedName = name.trim();
  const trimmedCompany = company.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  // Validate if any required field is empty
  if (!trimmedName || !trimmedCompany || !trimmedEmail || !trimmedPassword) {
    return res.status(400).json({ msg: "Please fill in all fields." });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(trimmedPassword, 10);
    const user = new User({ name: trimmedName, company: trimmedCompany, email: trimmedEmail, password: hash });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    await sendVerificationEmail(email, token);

    res.status(201).json({ msg: "User created. Please check your email to verify your account." });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error during registration." });
  }
});

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

module.exports = router;
