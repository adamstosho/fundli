const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fundli_jwt_secret_key_2024_secure_random_string';
  console.log('⚠️ JWT_SECRET not found in .env file, using default');
}

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const loanRoutes = require('./routes/loans');
const poolRoutes = require('./routes/pools');
const investmentRoutes = require('./routes/investments');
const marketplaceRoutes = require('./routes/marketplace');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const manualCollateralRoutes = require('./routes/manualCollateral');
const borrowerRoutes = require('./routes/borrower');
const lenderRoutes = require('./routes/lender');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');
const walletRoutes = require('./routes/wallet');
const escrowRoutes = require('./routes/escrow');
const creditScoreRoutes = require('./routes/creditScore');
const repaymentRoutes = require('./routes/repayments');
const twoFactorRoutes = require('./routes/twoFactor');
const matchingRoutes = require('./routes/matching');
const pushNotificationRoutes = require('./routes/pushNotifications');
const feedbackRoutes = require('./routes/feedback');

const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');
const { createRequestLogger } = require('./utils/logger');
const cronService = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - MUST be before rate limiting
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Rate limiting - disabled in development, enabled in production
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // More restrictive in production
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks, OPTIONS requests, auth endpoints
      return req.path === '/api/health' || 
             req.method === 'OPTIONS' ||
             req.path.startsWith('/api/auth/');
    }
  });
  app.use('/api', limiter);
} else {
  console.log('🚀 Rate limiting disabled in development mode');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Custom request logger
app.use(createRequestLogger());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/collateral', manualCollateralRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/lender', lenderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/credit-score', creditScoreRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/push-notifications', pushNotificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    const dbConnected = await connectDB();
    
    if (dbConnected) {
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('⚠️  Server starting without database connection');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Fundli Backend Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 Server accessible on: http://0.0.0.0:${PORT}`);
      
      // Start cron jobs only if database is connected
      if (dbConnected) {
        cronService.start();
        console.log('⏰ Cron jobs started');
      } else {
        console.log('⚠️  Cron jobs disabled (no database connection)');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer(); 