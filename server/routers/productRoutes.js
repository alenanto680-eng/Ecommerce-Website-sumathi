const express = require('express');
const router = express.Router();
const multer  = require('multer');
const productCtrl = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { uploadToS3, deleteFromS3 } = require('../conf/s3');

// ── Multer Setup ──
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Match Nginx/Express limits
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Settings
router.get('/settings/all', productCtrl.getSettings);
router.put('/settings/all', protect, productCtrl.updateSettings);

// Admin - GET the full list for management (MUST BE ABOVE /:id)
router.get('/admin', protect, productCtrl.getAdminProducts);

// Public - Featured sections for homepage (MUST BE ABOVE /:id)
router.get('/featured', productCtrl.getFeaturedProducts);

// Public - Main products list with optional filtering
router.get('/', productCtrl.getProducts);

// Admin - Create
router.post('/', protect, upload.single('image'), productCtrl.createProduct);

// Admin - Update
router.put('/:id', protect, upload.single('image'), productCtrl.updateProduct);

// Admin - Delete
router.delete('/:id', protect, productCtrl.deleteProduct);

module.exports = router;