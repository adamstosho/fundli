const express = require('express');
const router = express.Router();
const LendingPool = require('../models/LendingPool');
const { protect } = require('../middleware/auth');

// @desc    Create a new lending pool
// @route   POST /api/pools
// @access  Private (Lenders only)
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, poolSize, duration, interestRate, minInvestment, maxInvestment, riskLevel } = req.body;
    
    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can create lending pools'
      });
    }

    // Create the lending pool
    const pool = await LendingPool.create({
      creator: req.user.id,
      name,
      description,
      poolSize: parseFloat(poolSize),
      duration: parseInt(duration),
      interestRate: parseFloat(interestRate),
      minInvestment: parseFloat(minInvestment),
      maxInvestment: parseFloat(maxInvestment),
      riskLevel,
      status: 'active',
      fundingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      fundingProgress: 0
    });

    console.log('Pool created successfully:', pool);

    res.status(201).json({
      status: 'success',
      message: 'Lending pool created successfully',
      data: {
        pool: {
          id: pool._id,
          name: pool.name,
          description: pool.description,
          poolSize: pool.poolSize,
          duration: pool.duration,
          interestRate: pool.interestRate,
          minInvestment: pool.minInvestment,
          maxInvestment: pool.maxInvestment,
          riskLevel: pool.riskLevel,
          status: pool.status,
          fundingProgress: pool.fundingProgress,
          creator: pool.creator
        }
      }
    });

  } catch (error) {
    console.error('Error creating pool:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create lending pool',
      error: error.message
    });
  }
});

// @desc    Get all active lending pools
// @route   GET /api/pools
// @access  Public
router.get('/', async (req, res) => {
  try {
    const pools = await LendingPool.find({ status: 'active' })
      .populate('creator', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        pools: pools.map(pool => ({
          id: pool._id,
          name: pool.name,
          description: pool.description,
          poolSize: pool.poolSize,
          fundedAmount: pool.fundedAmount,
          duration: pool.duration,
          interestRate: pool.interestRate,
          minInvestment: pool.minInvestment,
          maxInvestment: pool.maxInvestment,
          riskLevel: pool.riskLevel,
          status: pool.status,
          fundingProgress: pool.fundingProgress,
          fundingDeadline: pool.fundingDeadline,
          creator: pool.creator,
          createdAt: pool.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lending pools',
      error: error.message
    });
  }
});

// @desc    Get pools created by the authenticated user
// @route   GET /api/pools/my-pools
// @access  Private
router.get('/my-pools', protect, async (req, res) => {
  try {
    const pools = await LendingPool.find({ creator: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        pools: pools.map(pool => ({
          id: pool._id,
          name: pool.name,
          description: pool.description,
          poolSize: pool.poolSize,
          fundedAmount: pool.fundedAmount,
          duration: pool.duration,
          interestRate: pool.interestRate,
          minInvestment: pool.minInvestment,
          maxInvestment: pool.maxInvestment,
          riskLevel: pool.riskLevel,
          status: pool.status,
          fundingProgress: pool.fundingProgress,
          fundingDeadline: pool.fundingDeadline,
          createdAt: pool.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching user pools:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your lending pools',
      error: error.message
    });
  }
});

// @desc    Get a specific pool by ID
// @route   GET /api/pools/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const pool = await LendingPool.findById(req.params.id)
      .populate('creator', 'firstName lastName email')
      .populate('investors.user', 'firstName lastName email');

    if (!pool) {
      return res.status(404).json({
        status: 'error',
        message: 'Lending pool not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        pool: {
          id: pool._id,
          name: pool.name,
          description: pool.description,
          poolSize: pool.poolSize,
          fundedAmount: pool.fundedAmount,
          duration: pool.duration,
          interestRate: pool.interestRate,
          minInvestment: pool.minInvestment,
          maxInvestment: pool.maxInvestment,
          riskLevel: pool.riskLevel,
          status: pool.status,
          fundingProgress: pool.fundingProgress,
          fundingDeadline: pool.fundingDeadline,
          creator: pool.creator,
          investors: pool.investors,
          createdAt: pool.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pool:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lending pool',
      error: error.message
    });
  }
});

module.exports = router; 