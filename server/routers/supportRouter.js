const express = require('express');
const router = express.Router();
const multer = require('multer');
const supportCtrl = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for video support
});

// User submission - Public
router.post('/submit', upload.array('attachments', 5), supportCtrl.submitSupportIssue);
router.get('/order/:orderId', supportCtrl.getIssuesByOrder);

// Admin routes - Protected for all Admins
router.get('/admin/issues', protect, supportCtrl.getAllIssues);
router.patch('/admin/issues/:id', protect, supportCtrl.updateIssueStatus);

module.exports = router;
