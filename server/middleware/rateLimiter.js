const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased to 1000 to allow smooth dashboard loading
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const clientAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased to 500 for high-frequency client syncs
    message: { success: false, message: 'Too many auth attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for admin sessions
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, 
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, clientAuthLimiter, adminLoginLimiter, paymentLimiter };
