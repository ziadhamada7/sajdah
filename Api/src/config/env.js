const dotenv = require('dotenv');
dotenv.config();

const env = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_me',
    NODE_ENV: process.env.NODE_ENV || 'development',
};

const required = ['MONGODB_URI'];
for (const key of required) {
    if (!env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

module.exports = env;
