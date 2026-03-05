const mongoose = require('mongoose');

const dailyObligationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    presentDone: {
        fajr: { type: Boolean, default: false },
        dhuhr: { type: Boolean, default: false },
        asr: { type: Boolean, default: false },
        maghrib: { type: Boolean, default: false },
        isha: { type: Boolean, default: false },
    },
    convertedToQada: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });


dailyObligationSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyObligation', dailyObligationSchema);
