require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
  const { email, glucoseValue, minThreshold, maxThreshold } = req.body;

  if (!email || !glucoseValue) {
    console.error("🚨 Missing required fields!", req.body);
    return res.status(400).json({ error: "Missing email or glucose value" });
  }

  const msg = {
    to: email,
    from: "sachirken1@gmail.com",
    subject: "Glucose Alert 🚨",
    text: `Your glucose level is ${glucoseValue}, which is outside the safe range (${minThreshold}-${maxThreshold}).`,
    html: `<p>Your glucose level is <strong>${glucoseValue}</strong>, outside the safe range (${minThreshold}-${maxThreshold}).</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent to", email);
    return res.json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("❌ Send error:", error.response?.body || error.message);
    return res.status(500).json({
      error: "Email sending failed",
      details: error.response?.body || error.message,
    });
  }
});

app.listen(3001, "127.0.0.1", () => {
  console.log("🚀 Server running on http://127.0.0.1:3001");
});
