const express = require('express');
const {
    register,
    login,
    getMe,
    logout
} = require('../controllers/auth.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
