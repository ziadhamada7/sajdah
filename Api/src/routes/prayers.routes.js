const express = require('express');
const router = express.Router();
const {
    ensureToday,
    markPresent,
    addQada,
    undo,
    dailyClose,
    closeMissedDays,
} = require('../controllers/prayers.controller');
const { validate, presentPrayerSchema, qadaPrayerSchema, dailyCloseSchema } = require('../utils/validate');
const auth = require('../middleware/auth');


router.use(auth);


router.post('/today/ensure', ensureToday);


router.post('/present', validate(presentPrayerSchema), markPresent);


router.post('/qada', validate(qadaPrayerSchema), addQada);


router.post('/undo', undo);


router.post('/daily-close', validate(dailyCloseSchema), dailyClose);


router.post('/close-missed', closeMissedDays);

module.exports = router;
