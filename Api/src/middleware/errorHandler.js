const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message,
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format',
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate entry',
            details: 'This record already exists',
        });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
};

module.exports = errorHandler;
