const express = require('express');
const router = express.Router();
const {
  submitContact,
  getAllContacts,
  getContactById,
  deleteContact,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// Public route — frontend contact form submits here
router.post('/', submitContact);

// Admin routes — NOW PROTECTED by secure cookies
router.get('/admin', protect, getAllContacts);
router.get('/admin/:id', protect, getContactById);
router.delete('/admin/:id', protect, deleteContact);

module.exports = router;