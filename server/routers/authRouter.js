const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/authController');
const { adminLoginLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');

// Max 5 login attempts per 15 min — blocks brute-force on admin password
router.post('/login', adminLoginLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
