const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getUserCollateral,
  getVerifiedCollateral,
  submitForVerification,
  updateVerificationStatus,
  getPendingVerifications,
  getCollateralStats,
  deleteCollateral,
  onfidoWebhook
} = require('../controllers/collateralController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/collateral');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Public webhook endpoint (no auth required)
router.post('/webhook', onfidoWebhook);

// Admin routes (require admin authentication) - must come before user routes
router.get('/admin/pending', adminAuth, getPendingVerifications);
router.get('/admin/stats', adminAuth, getCollateralStats);
router.put('/admin/:collateralId/status', adminAuth, updateVerificationStatus);

// User routes (require authentication)
router.use(protect);

// Get user's collateral
router.get('/user/:userId', getUserCollateral);

// Get verified collateral for a user (for lenders)
router.get('/verified/:userId', getVerifiedCollateral);

// Submit collateral for verification
router.post('/verify', upload.array('documents', 5), submitForVerification);

// Delete collateral (user can only delete pending collateral)
router.delete('/:collateralId', deleteCollateral);

module.exports = router;
