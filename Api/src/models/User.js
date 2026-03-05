const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    timezone: {
        type: String,
        default: 'Asia/Riyadh',
    },
    language: {
        type: String,
        enum: ['ar', 'en'],
        default: 'ar',
    },
    dayBoundary: {
        type: String,
        enum: ['FAJR', 'MIDNIGHT'],
        default: 'MIDNIGHT',
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
