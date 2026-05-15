// ── routers/productDetailRoutes.js ──
const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getProductDetail,
  getAdminProductDetail,
  upsertProductDetail,
  deleteProductDetail,
} = require('../controllers/productDetailController');

// ── Multer: accept any image field (image_0…6 + colorImg_<color>_0…6) ──
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

const uploadGallery = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'An image is too large. Maximum size is 20 MB.'
        : err.message || 'File upload error.';
      return res.status(400).json({ success: false, message: msg });
    }
    // Convert upload.any() array → object keyed by fieldname (same shape as upload.fields())
    if (Array.isArray(req.files)) {
      const obj = {};
      req.files.forEach(f => {
        obj[f.fieldname] = obj[f.fieldname] || [];
        obj[f.fieldname].push(f);
      });
      req.files = obj;
    }
    next();
  });
};

// ── Public ──
// GET /api/product-details/:productId
router.get('/:productId', getProductDetail);

// ── Admin - Now uses central secure cookie protection ──
// GET    /api/product-details/admin/:productId
router.get('/admin/:productId',    protect, getAdminProductDetail);
// POST   /api/product-details/admin/:productId  (create or update)
router.post('/admin/:productId',   protect, uploadGallery, upsertProductDetail);
// DELETE /api/product-details/admin/:productId
router.delete('/admin/:productId', protect, deleteProductDetail);

module.exports = router;