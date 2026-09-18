const nodemailer = require('nodemailer');

class MailerError extends Error {
    constructor(message, code, cause) {
        super(message);
        this.name = 'MailerError';
        this.code = code;
        this.cause = cause;
    }
}

const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new MailerError('EMAIL_USER and EMAIL_PASS must be configured', 'EMAIL_CONFIG_MISSING');
    }

    const port = Number(process.env.EMAIL_PORT || 465);
    const secure = process.env.EMAIL_SECURE
        ? process.env.EMAIL_SECURE === 'true'
        : port === 465;

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
};

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

    let transporter;
    try {
        transporter = getTransporter();
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (err) {
        console.error('Error sending OTP email:', {
            code: err.code,
            responseCode: err.responseCode,
            message: err.message
        });
        if (err instanceof MailerError) throw err;
        throw new MailerError('Failed to send OTP email', 'EMAIL_SEND_FAILED', err);
    } finally {
        transporter?.close();
    }
};

module.exports = { sendOTP };
