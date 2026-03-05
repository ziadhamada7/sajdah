const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const prayersRoutes = require('./src/routes/prayers.routes');
const historyRoutes = require('./src/routes/history.routes');
const settingsRoutes = require('./src/routes/settings.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/prayers', prayersRoutes);
app.use('/history', historyRoutes);
app.use('/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Sajdah API is running', version: '1.0.0' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const start = async () => {
    await connectDB();
    app.listen(env.PORT, () => {
        console.log(`Server running on port ${env.PORT}`);
    });
};

start();
