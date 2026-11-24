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

async function sendSms(phone, code) {
  const cleanPhone = phone.replace(/^\+?88/, "");
  const msg = `Your BD Pass verification OTP is: ${code}`;
  const url = `${process.env.SMS_API_URL}?api_key=${process.env.SMS_API_KEY}&type=text&number=88${cleanPhone}&senderid=${process.env.SMS_SENDER_ID}&message=${encodeURIComponent(msg)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("SMS gateway error");
}

async function sendEmailOtp(email, code) {
  await mailer.sendMail({
    from: `"BD Pass" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "BD Pass Verification Code",
    text: `Your 6-digit BD Pass OTP is: ${code}`
  });
}

app.post("/send-otp", async (req, res) => {
  try {
    const contact = String(req.body.contact || "").trim();
    if (!contact) return res.status(400).json({ ok: false, error: "Contact required" });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(contact.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    if (contact.includes("@")) {
      await sendEmailOtp(contact, code);
    } else {
      await sendSms(contact, code);
    }

    res.json({ ok: true, message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("OTP server running");
});
