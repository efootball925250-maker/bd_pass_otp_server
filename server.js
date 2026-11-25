const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const otpStore = new Map();

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendEmailOtp(email, code) {
  await mailer.sendMail({
    from: `"BD Pass" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "BD Pass Verification Code",
    text: `Your 6-digit BD Pass OTP is: ${code}`
  });
}

app.get("/", (req, res) => {
  res.json({ ok: true, service: "BD Pass OTP Server (Gmail)" });
});

app.post("/send-otp", async (req, res) => {
  try {
    const contact = String(req.body.contact || "").trim();
    if (!contact) {
      return res.status(400).json({ ok: false, error: "Gmail address required" });
    }

    if (!contact.includes("@")) {
      return res.status(400).json({ ok: false, error: "Currently only Gmail OTP is supported" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(contact.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    await sendEmailOtp(contact, code);
    res.json({ ok: true, message: "OTP sent to Gmail" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("OTP server running");
});
