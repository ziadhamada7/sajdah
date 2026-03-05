const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    language: Joi.string().valid('ar', 'en').default('ar'),
    timezone: Joi.string().default('Asia/Riyadh'),
    initialQadaEstimate: Joi.number().min(0).default(8000),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const presentPrayerSchema = Joi.object({
    prayer: Joi.string().valid('FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA').required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const qadaPrayerSchema = Joi.object({
    prayer: Joi.string().valid('FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA').required(),
    count: Joi.number().integer().min(1).required(),
});

const dailyCloseSchema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

const notificationSettingsSchema = Joi.object({
    enabled: Joi.object({
        fajr: Joi.boolean(),
        dhuhr: Joi.boolean(),
        asr: Joi.boolean(),
        maghrib: Joi.boolean(),
        isha: Joi.boolean(),
    }),
    offsetMinutes: Joi.object({
        fajr: Joi.number().integer().min(0),
        dhuhr: Joi.number().integer().min(0),
        asr: Joi.number().integer().min(0),
        maghrib: Joi.number().integer().min(0),
        isha: Joi.number().integer().min(0),
    }),
    soundEnabled: Joi.boolean(),
    manualTimes: Joi.object({
        fajr: Joi.string().pattern(/^\d{2}:\d{2}$/),
        dhuhr: Joi.string().pattern(/^\d{2}:\d{2}$/),
        asr: Joi.string().pattern(/^\d{2}:\d{2}$/),
        maghrib: Joi.string().pattern(/^\d{2}:\d{2}$/),
        isha: Joi.string().pattern(/^\d{2}:\d{2}$/),
    }),
});

const profileSchema = Joi.object({
    language: Joi.string().valid('ar', 'en'),
    timezone: Joi.string(),
    dayBoundary: Joi.string().valid('FAJR', 'MIDNIGHT'),
});

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            error: 'Validation Error',
            details: error.details.map(d => d.message),
        });
    }
    req.validatedBody = value;
    next();
};

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    presentPrayerSchema,
    qadaPrayerSchema,
    dailyCloseSchema,
    notificationSettingsSchema,
    profileSchema,
};
