router.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "User already exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, company, email, password: hash });

  await user.save();

  // TODO: send confirmation email here

  res.status(201).json({ msg: "User created. Please verify your email." });
});
