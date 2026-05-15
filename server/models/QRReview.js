// models/QRReview.js
// Stores reviews submitted via the QR code page (/review)
// These are NOT linked to any product or user — manually approved by admin

const mongoose = require('mongoose');

const qrReviewSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        message: { type: String, required: true, trim: true },
        status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('QRReview', qrReviewSchema);