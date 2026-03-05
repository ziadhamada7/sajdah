const mongoose = require('mongoose');

const qadaBalanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    totalRemaining: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('QadaBalance', qadaBalanceSchema);
