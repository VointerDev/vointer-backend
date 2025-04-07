const router = require("express").Router();
const { google } = require("googleapis");
const User = require("../models/User");

// Skyddad route som kräver Google Access Token
router.get("/availability", async (req, res) => {
  const userId = req.query.userId;

  try {
    const user = await User.findById(userId);
    if (!user || !user.google || !user.google.access_token) {
      return res.status(401).json({ msg: "Google access token missing" });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.google.access_token,
      refresh_token: user.google.refresh_token,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: weekAhead.toISOString(),
        timeZone: "Europe/Stockholm",
        items: [{ id: "primary" }],
      },
    });

    res.json(response.data.calendars["primary"].busy);
  } catch (err) {
    console.error("Failed to fetch calendar availability:", err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

module.exports = router;
