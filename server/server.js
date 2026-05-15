require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./conf/db');

const contactRouter = require('./routers/contactRouter');
const authRouter = require('./routers/authRouter');
const userRouter = require('./routers/userRouter');
const qrReviewRoutes = require('./routers/qrReviewRoutes');
const productReviewRoutes = require('./routers/productReviewRoutes');
const productRouter = require("./routers/productRoutes");
const productDetailRoutes = require('./routers/productDetailRoutes');
const clientRoutes = require('./routers/clientRoutes');
const clientManagementRoutes = require('./routers/clientManagementRoutes');
const paymentRouter = require('./routers/paymentRouter');
const supportRouter = require('./routers/supportRouter');
const shiprocketRouter = require('./routers/shiprocketRouter');
const startCronJobs = require('./cronJobs');
const { clientAuthLimiter, generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security Headers ──
// Relaxed CSP to allow Razorpay payment gateway to function correctly
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https://sumathi-trends.s3.ap-south-1.amazonaws.com", "https://lh3.googleusercontent.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      "frame-src": ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      "connect-src": ["'self'", "https://api.razorpay.com", "https://lumberjack-cx.razorpay.com"],
      "upgrade-insecure-requests": null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));

connectDB().then(() => {
  startCronJobs();
});

// ── CORS — only allow requests from our own frontend ──
const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:5173']
    : [])
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// ── Image Upload Limits ──
// Increased body limits to 50mb to allow high-resolution product images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ── Rate limiting ──
// General fallback — covers all routes (200 req / 15 min per IP)
app.use(generalLimiter);
// Client OTP auth — tighter (10 req / 15 min); covers all /api/client-auth/* routes
app.use('/api/client-auth', clientAuthLimiter);
// Payment limiter applied per-route inside paymentRouter.js
// Admin login limiter applied per-route inside authRouter.js

app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/users', userRouter);
app.use('/api/qr-reviews', qrReviewRoutes);
app.use('/api/product-reviews', productReviewRoutes);
app.use('/api/products', productRouter);
app.use('/api/product-details', productDetailRoutes);
app.use('/api/client-auth', clientRoutes);
app.use('/api/admin/clients', clientManagementRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/support', supportRouter);
app.use('/api/shiprocket', shiprocketRouter);

app.get('/', (req, res) => res.json({ message: 'Sumathi Trends API running.' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));