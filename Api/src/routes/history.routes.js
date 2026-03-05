const express = require('express');
const router = express.Router();
const { getHistory, getStats } = require('../controllers/history.controller');
const auth = require('../middleware/auth');

router.use(auth);


router.get('/', getHistory);


router.get('/stats', getStats);

module.exports = router;
