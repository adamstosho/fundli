const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const PenaltyConfigService = require('../services/penaltyConfigService');

// @desc    Get penalty configuration
// @route   GET /api/admin/penalty-config
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const config = PenaltyConfigService.getApiConfig();
    
    res.status(200).json({
      status: 'success',
      data: {
        config
      }
    });
  } catch (error) {
    console.error('Error fetching penalty configuration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch penalty configuration'
    });
  }
});

// @desc    Update penalty configuration
// @route   PUT /api/admin/penalty-config
// @access  Private (Admin only)
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      ratePerDay, 
      gracePeriodHours, 
      maxPenaltyDays, 
      currency, 
      enabled 
    } = req.body;

    const updateData = {};
    
    if (ratePerDay !== undefined) updateData.RATE_PER_DAY = ratePerDay;
    if (gracePeriodHours !== undefined) updateData.GRACE_PERIOD_HOURS = gracePeriodHours;
    if (maxPenaltyDays !== undefined) updateData.MAX_PENALTY_DAYS = maxPenaltyDays;
    if (currency !== undefined) updateData.CURRENCY = currency;
    if (enabled !== undefined) updateData.ENABLED = enabled;

    const updatedConfig = PenaltyConfigService.updateConfig(updateData);
    const apiConfig = PenaltyConfigService.getApiConfig();

    res.status(200).json({
      status: 'success',
      message: 'Penalty configuration updated successfully',
      data: {
        config: apiConfig
      }
    });
  } catch (error) {
    console.error('Error updating penalty configuration:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update penalty configuration'
    });
  }
});

// @desc    Test penalty calculation
// @route   POST /api/admin/penalty-config/test
// @access  Private (Admin only)
router.post('/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { amount, dueDate, paymentDate } = req.body;

    if (!amount || !dueDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount and due date are required'
      });
    }

    const penaltyResult = PenaltyConfigService.calculatePenalty(
      amount, 
      new Date(dueDate), 
      paymentDate ? new Date(paymentDate) : new Date()
    );

    res.status(200).json({
      status: 'success',
      data: {
        testResult: penaltyResult,
        config: PenaltyConfigService.getApiConfig()
      }
    });
  } catch (error) {
    console.error('Error testing penalty calculation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test penalty calculation'
    });
  }
});

// @desc    Get penalty statistics
// @route   GET /api/admin/penalty-config/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // This would typically fetch from database
    // For now, return basic stats
    const stats = {
      totalPenaltiesCollected: 0, // Would be calculated from database
      averagePenaltyAmount: 0, // Would be calculated from database
      totalLatePayments: 0, // Would be calculated from database
      penaltyRate: PenaltyConfigService.getPenaltyRatePercentage(),
      gracePeriodDays: PenaltyConfigService.getGracePeriodDays(),
      systemEnabled: PenaltyConfigService.isEnabled()
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching penalty statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch penalty statistics'
    });
  }
});

module.exports = router;
