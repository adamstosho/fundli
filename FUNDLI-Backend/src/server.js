const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const loanRoutes = require('./routes/loans');
const poolRoutes = require('./routes/pools');
const investmentRoutes = require('./routes/investments');
const marketplaceRoutes = require('./routes/marketplace');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const collateralRoutes = require('./routes/collateral');
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

const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/database');
const { createRequestLogger } = require('./utils/logger');
const cronService = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Custom request logger
app.use(createRequestLogger());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
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
app.use('/api/collateral', collateralRoutes);
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
app.use('/api/notifications', pushNotificationRoutes);

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
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`🚀 Fundli Backend Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      
      // Start cron jobs
      cronService.start();
      console.log('⏰ Cron jobs started');
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