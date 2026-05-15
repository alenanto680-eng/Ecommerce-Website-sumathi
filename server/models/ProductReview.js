// models/ProductReview.js
// Stores reviews submitted after delivery via WriteReview page
// Linked to a specific product, order, and firebase user (uid)
// Auto-approved on submit

const mongoose = require('mongoose');

const productReviewSchema = new mongoose.Schema(
    {
        uid: { type: String, required: true },               // Firebase user ID
        name: { type: String, required: true, trim: true },   // Display name
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        orderId: { type: String, required: true },               // Order it came from
        rating: { type: Number, required: true, min: 1, max: 5 },
        message: { type: String, required: true, trim: true },
        images: [{ type: String }],                             // S3 image URLs
        video: { type: String, default: null },                // S3 video URL
        status: { type: String, enum: ['pending', 'approved'], default: 'approved' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProductReview', productReviewSchema);