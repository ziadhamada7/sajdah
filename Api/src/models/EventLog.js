const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ts: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    prayer: {
        type: String,
        enum: ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA'],
        required: true,
    },
    type: {
        type: String,
        enum: ['PRESENT_DONE', 'QADA_DONE', 'CONVERT_MISSED', 'UNDO', 'ADJUST'],
        required: true,
    },
    count: {
        type: Number,
        default: 1,
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });

eventLogSchema.index({ userId: 1, date: 1 });
eventLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('EventLog', eventLogSchema);
