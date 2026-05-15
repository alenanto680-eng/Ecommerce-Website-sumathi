const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentController');
const {
    protect,
    superAdminOnly,
    verifyFirebaseToken,
    requireOwnership,
    anyAuth
} = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Rate-limited & Protected: Ensures only authenticated Firebase users can create/verify payments
router.post('/create-order', verifyFirebaseToken, paymentLimiter, paymentCtrl.createOrder);
router.post('/verify-payment', verifyFirebaseToken, paymentLimiter, paymentCtrl.verifyPayment);
router.post('/calculate-summary', verifyFirebaseToken, paymentLimiter, paymentCtrl.calculateSummary);

// Admin-only — protected by JWT (Allowed for all admins with permission)
router.get('/orders', protect, paymentCtrl.getAllOrders);

// User-specific order history — Protected by Firebase Token + Ownership Check
router.get('/user-orders/:uid', verifyFirebaseToken, requireOwnership, paymentCtrl.getUserOrders);
router.get('/orders/:orderId', verifyFirebaseToken, paymentCtrl.getOrderById);

// Tracking — Allows BOTH Admin JWT (for dashboard) and Firebase Token (for customer)
router.get('/track/:orderId', anyAuth, paymentCtrl.syncTrackingStatus);

// Admin manual sync (Allowed for all admins with permission)
router.post('/manual-sync-sr/:orderId', protect, paymentCtrl.manualSyncToShiprocket);

module.exports = router;