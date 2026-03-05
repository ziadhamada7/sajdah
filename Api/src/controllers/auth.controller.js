const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const QadaBalance = require('../models/QadaBalance');
const NotificationSettings = require('../models/NotificationSettings');
const env = require('../config/env');

const register = async (req, res, next) => {
    try {
        const { email, password, language, timezone, initialQadaEstimate } = req.validatedBody;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            passwordHash,
            language: language || 'ar',
            timezone: timezone || 'Asia/Riyadh',
        });

        await QadaBalance.create({
            userId: user._id,
            totalRemaining: initialQadaEstimate || 8000,
        });

        await NotificationSettings.create({ userId: user._id });

        const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                language: user.language,
                timezone: user.timezone,
                dayBoundary: user.dayBoundary,
            },
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.validatedBody;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                language: user.language,
                timezone: user.timezone,
                dayBoundary: user.dayBoundary,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const qadaBalance = await QadaBalance.findOne({ userId: req.userId });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                language: user.language,
                timezone: user.timezone,
                dayBoundary: user.dayBoundary,
            },
            qadaBalance: qadaBalance?.totalRemaining || 0,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };
