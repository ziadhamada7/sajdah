const express = require('express');
const router = express.Router();
const { getSettings, updateNotifications, updateProfile } = require('../controllers/settings.controller');
const { validate, notificationSettingsSchema, profileSchema } = require('../utils/validate');
const auth = require('../middleware/auth');

router.use(auth);


router.get('/', getSettings);


router.put('/notifications', validate(notificationSettingsSchema), updateNotifications);


router.put('/profile', validate(profileSchema), updateProfile);

module.exports = router;
