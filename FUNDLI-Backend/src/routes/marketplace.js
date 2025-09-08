const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const LendingPool = require('../models/LendingPool');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get available loans for marketplace
// @route   GET /api/marketplace/loans
// @access  Public
router.get('/loans', async (req, res) => {
  try {
    const { 
      category, 
      minAmount, 
      maxAmount, 
      riskLevel, 
      duration, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (duration) filter.duration = { $lte: parseInt(duration) };
    
    if (minAmount || maxAmount) {
      filter.poolSize = {};
      if (minAmount) filter.poolSize.$gte = parseFloat(minAmount);
      if (maxAmount) filter.poolSize.$lte = parseFloat(maxAmount);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get loans with pagination
    const loans = await LendingPool.find(filter)
      .populate('creator', 'firstName lastName company')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LendingPool.countDocuments(filter);

    // Format response
    const formattedLoans = loans.map(loan => ({
      id: loan._id,
      name: loan.name,
      description: loan.description,
      poolSize: loan.poolSize,
      fundedAmount: loan.fundingProgress?.fundedAmount || 0,
      fundingProgress: loan.fundingProgress?.fundedAmount && loan.poolSize ? 
        Math.round((loan.fundingProgress.fundedAmount / loan.poolSize) * 100) : 0,
      interestRate: loan.interestRate,
      duration: loan.duration,
      riskLevel: loan.riskLevel,
      category: loan.category,
      creator: {
        id: loan.creator._id,
        name: `${loan.creator.firstName} ${loan.creator.lastName}`,
        company: loan.creator.company?.name || 'Individual Lender'
      },
      createdAt: loan.createdAt,
      fundingDeadline: loan.fundingProgress?.fundingDeadline,
      isFullyFunded: loan.fundingProgress?.fundedAmount >= loan.poolSize
    }));

    res.status(200).json({
      status: 'success',
      data: {
        loans: formattedLoans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get marketplace loans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get marketplace loans',
      error: error.message
    });
  }
});

// @desc    Get specific loan details for marketplace
// @route   GET /api/marketplace/loans/:id
// @access  Public
router.get('/loans/:id', async (req, res) => {
  try {
    const loan = await LendingPool.findById(req.params.id)
      .populate('creator', 'firstName lastName email company kycVerified')
      .populate('investors.user', 'firstName lastName');

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Format detailed loan information
    const formattedLoan = {
      id: loan._id,
      name: loan.name,
      description: loan.description,
      poolSize: loan.poolSize,
      fundedAmount: loan.fundingProgress?.fundedAmount || 0,
      fundingProgress: loan.fundingProgress?.fundedAmount && loan.poolSize ? 
        Math.round((loan.fundingProgress.fundedAmount / loan.poolSize) * 100) : 0,
      interestRate: loan.interestRate,
      duration: loan.duration,
      riskLevel: loan.riskLevel,
      category: loan.category,
      terms: loan.terms,
      creator: {
        id: loan.creator._id,
        name: `${loan.creator.firstName} ${loan.creator.lastName}`,
        email: loan.creator.email,
        company: loan.creator.company?.name || 'Individual Lender',
        kycVerified: loan.creator.kycVerified
      },
      investors: loan.investors?.map(investor => ({
        user: {
          id: investor.user._id,
          name: `${investor.user.firstName} ${investor.user.lastName}`
        },
        amount: investor.amount,
        investedAt: investor.investedAt
      })) || [],
      createdAt: loan.createdAt,
      fundingDeadline: loan.fundingProgress?.fundingDeadline,
      isFullyFunded: loan.fundingProgress?.fundedAmount >= loan.poolSize,
      status: loan.status
    };

    res.status(200).json({
      status: 'success',
      data: {
        loan: formattedLoan
      }
    });

  } catch (error) {
    console.error('Get marketplace loan details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get loan details',
      error: error.message
    });
  }
});

// @desc    Get available lending pools for marketplace
// @route   GET /api/marketplace/pools
// @access  Public
router.get('/pools', async (req, res) => {
  try {
    const { 
      category, 
      minAmount, 
      maxAmount, 
      riskLevel, 
      duration, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (duration) filter.duration = { $lte: parseInt(duration) };
    
    if (minAmount || maxAmount) {
      filter.poolSize = {};
      if (minAmount) filter.poolSize.$gte = parseFloat(minAmount);
      if (maxAmount) filter.poolSize.$lte = parseFloat(maxAmount);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get pools with pagination
    const pools = await LendingPool.find(filter)
      .populate('creator', 'firstName lastName company')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LendingPool.countDocuments(filter);

    // Format response
    const formattedPools = pools.map(pool => ({
      id: pool._id,
      name: pool.name,
      description: pool.description,
      poolSize: pool.poolSize,
      fundedAmount: pool.fundingProgress?.fundedAmount || 0,
      fundingProgress: pool.fundingProgress?.fundedAmount && pool.poolSize ? 
        Math.round((pool.fundingProgress.fundedAmount / pool.poolSize) * 100) : 0,
      interestRate: pool.interestRate,
      duration: pool.duration,
      riskLevel: pool.riskLevel,
      category: pool.category,
      creator: {
        id: pool.creator._id,
        name: `${pool.creator.firstName} ${pool.creator.lastName}`,
        company: pool.creator.company?.name || 'Individual Lender'
      },
      createdAt: pool.createdAt,
      fundingDeadline: pool.fundingProgress?.fundingDeadline,
      isFullyFunded: pool.fundingProgress?.fundedAmount >= pool.poolSize
    }));

    res.status(200).json({
      status: 'success',
      data: {
        pools: formattedPools,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get marketplace pools error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get marketplace pools',
      error: error.message
    });
  }
});

// @desc    Get specific pool details for marketplace
// @route   GET /api/marketplace/pools/:id
// @access  Public
router.get('/pools/:id', async (req, res) => {
  try {
    const pool = await LendingPool.findById(req.params.id)
      .populate('creator', 'firstName lastName email company kycVerified')
      .populate('investors.user', 'firstName lastName');

    if (!pool) {
      return res.status(404).json({
        status: 'error',
        message: 'Pool not found'
      });
    }

    // Format detailed pool information
    const formattedPool = {
      id: pool._id,
      name: pool.name,
      description: pool.description,
      poolSize: pool.poolSize,
      fundedAmount: pool.fundingProgress?.fundedAmount || 0,
      fundingProgress: pool.fundingProgress?.fundedAmount && pool.poolSize ? 
        Math.round((pool.fundingProgress.fundedAmount / pool.poolSize) * 100) : 0,
      interestRate: pool.interestRate,
      duration: pool.duration,
      riskLevel: pool.riskLevel,
      category: pool.category,
      terms: pool.terms,
      creator: {
        id: pool.creator._id,
        name: `${pool.creator.firstName} ${pool.creator.lastName}`,
        email: pool.creator.email,
        company: pool.creator.company?.name || 'Individual Lender',
        kycVerified: pool.creator.kycVerified
      },
      investors: pool.investors?.map(investor => ({
        user: {
          id: investor.user._id,
          name: `${investor.user.firstName} ${investor.user.lastName}`
        },
        amount: investor.amount,
        investedAt: investor.investedAt
      })) || [],
      createdAt: pool.createdAt,
      fundingDeadline: pool.fundingProgress?.fundingDeadline,
      isFullyFunded: pool.fundingProgress?.fundedAmount >= pool.poolSize,
      status: pool.status
    };

    res.status(200).json({
      status: 'success',
      data: {
        pool: formattedPool
      }
    });

  } catch (error) {
    console.error('Get marketplace pool details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get pool details',
      error: error.message
    });
  }
});

// @desc    Search loans in marketplace
// @route   GET /api/marketplace/search/loans
// @access  Public
router.get('/search/loans', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Build search filter
    const searchFilter = {
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search loans
    const loans = await LendingPool.find(searchFilter)
      .populate('creator', 'firstName lastName company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await LendingPool.countDocuments(searchFilter);

    // Format response
    const formattedLoans = loans.map(loan => ({
      id: loan._id,
      name: loan.name,
      description: loan.description,
      poolSize: loan.poolSize,
      fundedAmount: loan.fundingProgress?.fundedAmount || 0,
      fundingProgress: loan.fundingProgress?.fundedAmount && loan.poolSize ? 
        Math.round((loan.fundingProgress.fundedAmount / loan.poolSize) * 100) : 0,
      interestRate: loan.interestRate,
      duration: loan.duration,
      riskLevel: loan.riskLevel,
      category: loan.category,
      creator: {
        id: loan.creator._id,
        name: `${loan.creator.firstName} ${loan.creator.lastName}`,
        company: loan.creator.company?.name || 'Individual Lender'
      },
      createdAt: loan.createdAt,
      fundingDeadline: loan.fundingProgress?.fundingDeadline,
      isFullyFunded: loan.fundingProgress?.fundedAmount >= loan.poolSize
    }));

    res.status(200).json({
      status: 'success',
      data: {
        loans: formattedLoans,
        query,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search loans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search loans',
      error: error.message
    });
  }
});

// @desc    Search pools in marketplace
// @route   GET /api/marketplace/search/pools
// @access  Public
router.get('/search/pools', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Build search filter
    const searchFilter = {
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search pools
    const pools = await LendingPool.find(searchFilter)
      .populate('creator', 'firstName lastName company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await LendingPool.countDocuments(searchFilter);

    // Format response
    const formattedPools = pools.map(pool => ({
      id: pool._id,
      name: pool.name,
      description: pool.description,
      poolSize: pool.poolSize,
      fundedAmount: pool.fundingProgress?.fundedAmount || 0,
      fundingProgress: pool.fundingProgress?.fundedAmount && pool.poolSize ? 
        Math.round((pool.fundingProgress.fundedAmount / pool.poolSize) * 100) : 0,
      interestRate: pool.interestRate,
      duration: pool.duration,
      riskLevel: pool.riskLevel,
      category: pool.category,
      creator: {
        id: pool.creator._id,
        name: `${pool.creator.firstName} ${pool.creator.lastName}`,
        company: pool.creator.company?.name || 'Individual Lender'
      },
      createdAt: pool.createdAt,
      fundingDeadline: pool.fundingProgress?.fundingDeadline,
      isFullyFunded: pool.fundingProgress?.fundedAmount >= pool.poolSize
    }));

    res.status(200).json({
      status: 'success',
      data: {
        pools: formattedPools,
        query,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search pools error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search pools',
      error: error.message
    });
  }
});

// @desc    Get marketplace statistics
// @route   GET /api/marketplace/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Get total active loans/pools
    const totalActive = await LendingPool.countDocuments({ status: 'active' });
    
    // Get total funded amount
    const fundedPools = await LendingPool.find({ status: 'active' });
    const totalFunded = fundedPools.reduce((sum, pool) => {
      return sum + (pool.fundingProgress?.fundedAmount || 0);
    }, 0);

    // Get total pool size
    const totalPoolSize = fundedPools.reduce((sum, pool) => {
      return sum + pool.poolSize;
    }, 0);

    // Get category distribution
    const categoryStats = await LendingPool.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get risk level distribution
    const riskStats = await LendingPool.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalActive,
        totalFunded,
        totalPoolSize,
        fundingProgress: totalPoolSize > 0 ? Math.round((totalFunded / totalPoolSize) * 100) : 0,
        categoryDistribution: categoryStats,
        riskDistribution: riskStats
      }
    });

  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get marketplace statistics',
      error: error.message
    });
  }
});

module.exports = router;
