const express = require('express');
const {
    register,
    login,
    getMe,
    logout,
    logoutAll
} = require('./auth.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;
