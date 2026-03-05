const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    enabled: {
        fajr: { type: Boolean, default: true },
        dhuhr: { type: Boolean, default: true },
        asr: { type: Boolean, default: true },
        maghrib: { type: Boolean, default: true },
        isha: { type: Boolean, default: true },
    },
    offsetMinutes: {
        fajr: { type: Number, default: 0 },
        dhuhr: { type: Number, default: 0 },
        asr: { type: Number, default: 0 },
        maghrib: { type: Number, default: 0 },
        isha: { type: Number, default: 0 },
    },
    soundEnabled: {
        type: Boolean,
        default: true,
    },
    manualTimes: {
        fajr: { type: String, default: '05:00' },
        dhuhr: { type: String, default: '12:30' },
        asr: { type: String, default: '15:45' },
        maghrib: { type: String, default: '18:15' },
        isha: { type: String, default: '19:45' },
    },
}, { timestamps: true });

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
