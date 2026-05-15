// controllers/productReviewController.js
// Handles delivery reviews — linked to product, order, and user
// Files uploaded to S3. Auto-approved on submit.

const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../conf/s3');

const BUCKET = process.env.AWS_S3_BUCKET;
const REGION = process.env.AWS_REGION;

// ── S3 Upload Helper ──
const uploadFile = async (file) => {
    const ext = file.originalname.split('.').pop();
    const key = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
    }));
    return `https://s3.${REGION}.amazonaws.com/${BUCKET}/${key}`;
};

// ── Update product's aggregate star rating ──
const updateProductStats = async (productId) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return;
    const product = await Product.findById(productId);
    if (!product) return;
    const all = await ProductReview.find({ productId, status: 'approved' });
    const total = all.length;
    product.stars = total > 0 ? parseFloat((all.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)) : 0;
    product.reviews = total;
    await product.save();
};

// POST /api/product-reviews/submit — public (called by WriteReview.jsx)
exports.submitProductReview = async (req, res) => {
    try {
        const { name, rating, message, productId, uid, orderId } = req.body;

        if (!name || !rating || !message)
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        if (rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });
        if (!uid)
            return res.status(400).json({ success: false, message: 'User not authenticated.' });
        if (!productId || !mongoose.Types.ObjectId.isValid(productId))
            return res.status(400).json({ success: false, message: 'Invalid product ID.' });
        if (!orderId)
            return res.status(400).json({ success: false, message: 'Order ID is required.' });

        // Upload files to S3
        const images = [];
        let video = null;
        if (req.files?.length > 0) {
            for (const file of req.files) {
                try {
                    const url = await uploadFile(file);
                    if (file.mimetype.startsWith('video/')) video = url;
                    else images.push(url);
                } catch (uploadErr) {
                    console.error('S3 upload failed:', file.originalname, uploadErr.message);
                    // Continue — don't crash the whole review if one file fails
                }
            }
        }

        const review = await ProductReview.create({
            uid,
            name: name.trim(),
            productId,
            orderId,
            rating: Number(rating),
            message: message.trim(),
            images,
            video,
            status: 'approved', // auto-approved for delivery reviews
        });

        // Update product's star rating immediately
        await updateProductStats(productId);

        res.json({ success: true, data: review, autoApproved: true });
    } catch (err) {
        console.error('Product review submit error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
};

// GET /api/product-reviews/product/:productId — public (used by ProductReviews.jsx)
exports.getByProduct = async (req, res) => {
    try {
        const reviews = await ProductReview.find({
            productId: req.params.productId,
            status: 'approved',
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// GET /api/product-reviews/user/:uid — public (used by MyReviews.jsx)
exports.getByUser = async (req, res) => {
    try {
        const reviews = await ProductReview.find({ uid: req.params.uid })
            .populate('productId', 'name img')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// DELETE /api/product-reviews/:id — private (called by MyReviews.jsx)
exports.deleteProductReview = async (req, res) => {
    try {
        const review = await ProductReview.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

        const productId = review.productId;
        await ProductReview.findByIdAndDelete(req.params.id);

        // Update product stats after deletion
        await updateProductStats(productId);

        res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (err) {
        console.error('Delete product review error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/product-reviews/client/:clientId — admin
// Used by clientManagementController to show reviews in client drawer
// Accepts an array of uids as query param: ?uids=uid1,uid2
exports.getByClientUids = async (req, res) => {
    try {
        const uids = (req.query.uids || '').split(',').filter(Boolean);
        if (!uids.length) return res.json({ success: true, data: [] });
        const reviews = await ProductReview.find({ uid: { $in: uids } }).sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};