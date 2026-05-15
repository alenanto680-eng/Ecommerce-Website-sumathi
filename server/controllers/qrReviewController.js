// controllers/qrReviewController.js
// Handles QR code reviews — no files, no product link, admin approval required

const QRReview = require('../models/QRReview');

// POST /api/qr-reviews/submit — public (called by ReviewSubmit.jsx)
exports.submitQRReview = async (req, res) => {
    try {
        const { name, rating, message } = req.body;
        if (!name || !rating || !message)
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        if (rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });

        const review = await QRReview.create({
            name: name.trim(),
            rating: Number(rating),
            message: message.trim(),
            status: 'pending',
        });

        res.json({ success: true, data: review });
    } catch (err) {
        console.error('QR review submit error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/qr-reviews/admin — admin (used by reviewmanagement.jsx)
exports.getAllQRReviews = async (req, res) => {
    try {
        const reviews = await QRReview.find().sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// PATCH /api/qr-reviews/admin/:id/approve — admin
exports.approveQRReview = async (req, res) => {
    try {
        const review = await QRReview.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true }
        );
        if (!review) return res.status(404).json({ success: false });
        res.json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// PATCH /api/qr-reviews/admin/:id/unapprove — admin
exports.unapproveQRReview = async (req, res) => {
    try {
        const review = await QRReview.findByIdAndUpdate(
            req.params.id,
            { status: 'pending' },
            { new: true }
        );
        if (!review) return res.status(404).json({ success: false });
        res.json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// DELETE /api/qr-reviews/admin/:id — admin
exports.deleteQRReview = async (req, res) => {
    try {
        const review = await QRReview.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// GET /api/qr-reviews/approved — public (used by homepage Reviews carousel)
exports.getApprovedQRReviews = async (req, res) => {
    try {
        const reviews = await QRReview.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};