const User = require('../models/User');
const NotificationSettings = require('../models/NotificationSettings');


const getSettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        const notifSettings = await NotificationSettings.findOne({ userId: req.userId });

        if (!notifSettings) {
            await NotificationSettings.create({ userId: req.userId });
        }

        res.json({
            profile: {
                email: user.email,
                language: user.language,
                timezone: user.timezone,
                dayBoundary: user.dayBoundary,
            },
            notifications: notifSettings || await NotificationSettings.findOne({ userId: req.userId }),
        });
    } catch (error) {
        next(error);
    }
};


const updateNotifications = async (req, res, next) => {
    try {
        const updates = req.validatedBody;

        const notifSettings = await NotificationSettings.findOneAndUpdate(
            { userId: req.userId },
            { $set: updates },
            { new: true, upsert: true }
        );

        res.json({ notifications: notifSettings });
    } catch (error) {
        next(error);
    }
};


const updateProfile = async (req, res, next) => {
    try {
        const updates = req.validatedBody;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true }
        ).select('-passwordHash');

        res.json({
            profile: {
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

module.exports = { getSettings, updateNotifications, updateProfile };
