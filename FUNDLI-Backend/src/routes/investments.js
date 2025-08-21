const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Get investments for a specific lender
// @route   GET /api/investments/lender
// @access  Private
router.get('/lender', protect, async (req, res) => {
  try {
    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can access investment data'
      });
    }

    // For now, return empty data since we don't have the Investment model yet
    // This will be updated when we implement the full investment system
    res.status(200).json({
      status: 'success',
      data: {
        investments: []
      }
    });

  } catch (error) {
    console.error('Error fetching lender investments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch investment data',
      error: error.message
    });
  }
});

module.exports = router; 