const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOTP } = require('../utils/mailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   GET api/auth/user
// @desc    Get user data
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/signup
// @desc    Register user and send OTP
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (user) {
            // Update existing unverified user
            user.name = name;
            user.password = password;
            user.otp = otp;
            user.otpExpires = otpExpires;
        } else {
            user = new User({
                name,
                email,
                password,
                otp,
                otpExpires
            });
        }

        await user.save();
        await sendOTP(email, otp);

        res.json({ msg: 'OTP sent to email. Please verify.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and activate user
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key_here', { expiresIn: '24h' });

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/google
// @desc    Google Sign-In/Signup
router.post('/google', async (req, res) => {
    const { tokenId } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { name, email, sub } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            // Create user for Google Sign-in (password-less or dummy password)
            user = new User({
                name,
                email,
                password: Math.random().toString(36).slice(-8), // Dummy password
                isVerified: true
            });
            await user.save();
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key_here', { expiresIn: '24h' });

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ msg: 'Google Auth failed' });
    }
});

// @route   POST api/auth/update-profile
// @desc    Update user profile (name, password)
router.post('/update-profile', auth, async (req, res) => {
    const { name, password } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ msg: 'Profile updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    console.log('--- LOGIN ATTEMPT START ---');
    const { email, password } = req.body;

    try {
        console.log('Finding user...');
        let user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

// Signing JWT token...
        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'your_jwt_secret_key_here', 
            { expiresIn: '24h' }
        );
        console.log('--- LOGIN ATTEMPT SUCCESS --- Token generated');
        res.json({ token });
    } catch (err) {
        console.error('--- LOGIN ATTEMPT FAILED ---');
        console.error('Error Message:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/forgot-password
// @desc    Send OTP for password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTP(email, otp);

        res.json({ msg: 'OTP sent to your email. Please verify.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using OTP
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // Set new password (the pre-save hook in User model will hash it)
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true; 
        await user.save();

        res.json({ msg: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
