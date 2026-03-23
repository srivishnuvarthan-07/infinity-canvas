const express = require('express');
const { searchUsers, deleteMe } = require('./user.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.get('/search', protect, searchUsers);
router.delete('/me', protect, deleteMe);

module.exports = router;
