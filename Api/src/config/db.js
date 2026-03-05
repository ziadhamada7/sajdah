const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
};

module.exports = connectDB;
