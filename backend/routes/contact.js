const express = require('express');
const router = express.Router();
const { sendOTP } = require('../utils/mailer'); // We can reuse sendOTP or create a generic mail function
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.post('/', async (req, res) => {
    const { user_name, user_email, subject, message } = req.body;

    if (!user_name || !user_email || !subject || !message) {
        return res.status(400).json({ msg: 'Please fill all fields' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to yourself
        subject: `Contact Form: ${subject}`,
        text: `Name: ${user_name}\nEmail: ${user_email}\nMessage: ${message}`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1E3A8A;">New Contact Message</h2>
                <p><strong>Name:</strong> ${user_name}</p>
                <p><strong>Email:</strong> ${user_email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <div style="padding: 10px; background: #f3f4f6; border-radius: 5px;">${message}</div>
              </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ msg: 'Message sent successfully' });
    } catch (err) {
        console.error('Error sending contact email:', err);
        res.status(500).json({ msg: 'Server error, could not send message' });
    }
});

module.exports = router;
