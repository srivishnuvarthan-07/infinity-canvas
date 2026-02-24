const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('./notification.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
