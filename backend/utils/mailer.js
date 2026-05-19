const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'RProfile.ai - Your OTP for Email Verification',
        text: `Your OTP for verification is: ${otp}. It will expire in 10 minutes.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1E3A8A;">RProfile.ai</h2>
                <p>Hello,</p>
                <p>Thank you for joining RProfile.ai. Please use the following One-Time Password (OTP) to verify your email address:</p>
                <div style="font-size: 24px; font-weight: bold; color: #3B82F6; padding: 10px; background: #f3f4f6; text-align: center; border-radius: 5px;">${otp}</div>
                <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                <p>Best regards,<br/>The RProfile.ai Team</p>
              </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (err) {
        console.error('Error sending email:', err);
        throw new Error('Failed to send OTP email');
    }
};

module.exports = { sendOTP };
