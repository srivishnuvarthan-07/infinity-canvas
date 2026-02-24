const express = require('express');
const { searchUsers } = require('./user.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/search', searchUsers);

module.exports = router;
