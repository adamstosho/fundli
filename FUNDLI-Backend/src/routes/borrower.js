const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const LendingPool = require('../models/LendingPool');
const Wallet = require('../models/Wallet');
const { protect } = require('../middleware/auth');
const PaystackService = require('../services/paystackService');

// @desc    Get available lending pools for borrowers to browse
// @route   GET /api/borrower/available-loans
// @access  Private (Borrowers only)
router.get('/available-loans', protect, async (req, res) => {
  try {
    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Only borrowers can view available lending pools'
      });
    }

    console.log('🔍 Fetching available lending pools for borrower:', req.user.id);

    // Get active lending pools that borrowers can apply to
    const availablePools = await LendingPool.find({ 
      status: 'active'
    })
    .populate('creator', 'firstName lastName email userType')
    .sort({ createdAt: -1 })
    .select('-__v');

    console.log('📊 Found', availablePools.length, 'available lending pools');

    // Format the response to look like loans for frontend compatibility
    const formattedLoans = availablePools.map(pool => ({
      id: pool._id,
      name: pool.name,
      purpose: pool.name,
      purposeDescription: pool.description,
      loanAmount: pool.poolSize,
      poolSize: pool.poolSize,
      duration: pool.duration,
      interestRate: pool.interestRate,
      riskLevel: pool.riskLevel,
      status: pool.status,
      createdAt: pool.createdAt,
      fundingProgress: pool.fundingProgress,
      minInvestment: pool.minInvestment,
      maxInvestment: pool.maxInvestment,
      lender: {
        id: pool.creator._id,
        name: `${pool.creator.firstName} ${pool.creator.lastName}`,
        email: pool.creator.email,
        userType: pool.creator.userType
      }
    }));

    res.status(200).json({
      status: 'success',
      data: {
        loans: formattedLoans,
        total: formattedLoans.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available lending pools:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available lending pools',
      error: error.message
    });
  }
});

// @desc    Apply for a specific loan
// @route   POST /api/borrower/loan/:loanId/apply
// @access  Private (Borrowers only)
router.post('/loan/:loanId/apply', protect, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { 
      requestedAmount, 
      purpose, 
      duration, 
      collateral,
      bvn, 
      accountNumber, 
      bankCode 
    } = req.body;

    // Validate required fields
    if (!requestedAmount || !purpose || !duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: requestedAmount, purpose, and duration are required'
      });
    }

    // Debug collateral data
    console.log('🔍 Collateral validation - Raw collateral:', collateral);
    console.log('🔍 Collateral validation - Type:', typeof collateral);
    console.log('🔍 Collateral validation - Has type:', collateral?.type);

    // Validate collateral - can be string or object
    if (!collateral || (typeof collateral === 'object' && !collateral.type)) {
      console.log('❌ Collateral validation failed - missing collateral or type');
      return res.status(400).json({
        status: 'error',
        message: 'Collateral information is required'
      });
    }

    // Skip user type check for now - allow all authenticated users to apply
    console.log('🔍 User applying for loan:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding with loan application for user:', req.user.id);

    // Check if the loan exists and is available
    const lendingPool = await LendingPool.findById(loanId);
    if (!lendingPool) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    if (lendingPool.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is not available for applications'
      });
    }

    // Each loan application requires its own collateral submission
    // No global collateral verification required - each loan is independent

    // Check if user has already applied for this lending pool
    const existingApplication = await Loan.findOne({
      borrower: req.user.id,
      lendingPool: loanId,
      status: { $in: ['pending', 'approved', 'funded', 'active'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already applied for this lending pool. You cannot apply multiple times for the same pool.'
      });
    }

    // Check if user has already applied for a loan with the same purpose recently (within 24 hours)
    const recentApplication = await Loan.findOne({
      borrower: req.user.id,
      purpose: purpose, // Same purpose
      status: { $in: ['pending', 'approved', 'funded', 'active'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
    });

    if (recentApplication) {
      return res.status(400).json({
        status: 'error',
        message: `You have already applied for a ${purpose} loan recently. Please wait for it to be processed before applying for another ${purpose} loan.`
      });
    }

    // KYC is no longer mandatory to apply; if KYC details are provided, process and attach to profile, otherwise continue
    if (!req.user.kycVerified && bvn && accountNumber && bankCode) {
      try {
        const bvnResult = await PaystackService.verifyBVN(bvn);
        const bankResult = await PaystackService.verifyBankAccount(accountNumber, bankCode);
        if (bvnResult.success && bankResult.success) {
          await User.findByIdAndUpdate(req.user.id, {
            'kycData.bvn': {
              number: bvn,
              verified: true,
              verificationResult: bvnResult.data,
              verifiedAt: new Date()
            },
            'kycData.bankAccount': {
              accountNumber,
              bankCode,
              bankName: bankResult.data.bank,
              accountName: bankResult.data.account_name,
              verified: true,
              verificationResult: bankResult.data,
              verifiedAt: new Date()
            },
            'kycData.submittedAt': new Date(),
            kycStatus: 'pending'
          });
        }
      } catch (kycError) {
        console.error('Optional KYC processing error (continuing without KYC):', kycError);
      }
    }

    // Calculate loan terms using the lending pool's interest rate
    const interestRate = lendingPool.interestRate || 8; // Default to 8% if not set
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = parseInt(duration);
    
    let monthlyPayment, totalRepayment, totalInterest;
    
    if (monthlyRate > 0) {
      monthlyPayment = (parseFloat(requestedAmount) * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = parseFloat(requestedAmount) / numberOfPayments;
    }
    
    totalRepayment = monthlyPayment * numberOfPayments;
    totalInterest = totalRepayment - parseFloat(requestedAmount);

    // Find the most recent collateral verification for this user
    const Collateral = require('../models/Collateral');
    const userCollateral = await Collateral.findOne({
      userId: req.user.id,
      verificationStatus: 'approved'
    }).sort({ approvedAt: -1 });

    // Create loan application
    console.log('📝 Creating loan application with data:', {
      borrower: req.user.id,
      lendingPool: loanId,
      loanAmount: parseFloat(requestedAmount),
      purpose,
      duration: numberOfPayments,
      status: 'pending',
      hasCollateralVerification: !!userCollateral
    });

    // Build loan data object
    const loanData = {
      borrower: req.user.id,
      lendingPool: loanId,
      loanAmount: parseFloat(requestedAmount),
      purpose,
      purposeDescription: `Loan application for ${purpose} - ${collateral || 'No collateral provided'}`,
      duration: numberOfPayments,
      interestRate: interestRate,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      amountRemaining: Math.round(totalRepayment * 100) / 100,
      collateral: collateral ? (typeof collateral === 'object' ? {
        type: collateral.type || 'other',
        description: collateral.description || 'No description provided',
        estimatedValue: collateral.estimatedValue || 0,
        documents: collateral.documents || []
      } : {
        type: 'other',
        description: collateral
      }) : null,
      status: 'pending',
      kycStatus: req.user.kycVerified ? 'verified' : 'pending',
      fundingProgress: {
        targetAmount: parseFloat(requestedAmount),
        fundedAmount: 0
      },
      submittedAt: new Date()
    };

    // Only add collateralVerification if userCollateral exists
    if (userCollateral) {
      loanData.collateralVerification = {
        id: userCollateral._id,
        type: userCollateral.collateralType,
        description: userCollateral.description,
        estimatedValue: userCollateral.estimatedValue,
        documents: userCollateral.collateralDocuments || [],
        bankStatement: userCollateral.bankStatement,
        bvn: userCollateral.bvn,
        verificationStatus: userCollateral.verificationStatus,
        approvedAt: userCollateral.approvedAt
      };
    }

    const loan = await Loan.create(loanData);

    console.log('✅ Loan application created successfully:', {
      id: loan._id,
      status: loan.status,
      borrower: loan.borrower,
      amount: loan.loanAmount,
      purpose: loan.purpose
    });

    res.status(201).json({
      status: 'success',
      message: 'Loan application submitted successfully',
      data: {
        loan: {
          id: loan._id,
          loanAmount: loan.loanAmount,
          purpose: loan.purpose,
          status: loan.status,
          kycStatus: loan.kycStatus
        }
      }
    });

  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit loan application',
      error: error.message
    });
  }
});

// @desc    Apply for loan with KYC verification
// @route   POST /api/borrower/loan/apply
// @access  Private (Borrowers only)
router.post('/loan/apply', protect, async (req, res) => {
  try {
    const { 
      loanAmount, 
      purpose, 
      duration, 
      collateral, 
      bvn, 
      accountNumber, 
      bankCode 
    } = req.body;

    // Validate required fields
    if (!loanAmount || !purpose || !duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: loanAmount, purpose, and duration are required'
      });
    }

    // Validate collateral - can be string or object
    if (!collateral || (typeof collateral === 'object' && !collateral.type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Collateral information is required'
      });
    }

    // Each loan application requires its own collateral submission
    // No global collateral verification required - each loan is independent

    // Check if user has already applied for a loan with the same purpose recently (within 24 hours)
    const recentApplication = await Loan.findOne({
      borrower: req.user.id,
      purpose: purpose, // Same purpose
      status: { $in: ['pending', 'approved', 'funded', 'active'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
    });

    if (recentApplication) {
      return res.status(400).json({
        status: 'error',
        message: `You have already applied for a ${purpose} loan recently. Please wait for it to be processed before applying for another ${purpose} loan.`
      });
    }

    // Validate loan amount
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid loan amount. Must be a positive number.'
      });
    }

    // Validate duration
    const durationMonths = parseInt(duration);
    if (isNaN(durationMonths) || durationMonths <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid duration. Must be a positive number of months.'
      });
    }

    // KYC is no longer mandatory to apply; process optional KYC if provided
    if (!req.user.kycVerified && bvn && accountNumber && bankCode) {
      try {
        // Only attempt KYC verification if PaystackService is properly configured
        if (PaystackService && !PaystackService.disabled) {
          const bvnResult = await PaystackService.verifyBVN(bvn);
          const bankResult = await PaystackService.verifyBankAccount(accountNumber, bankCode);
          if (bvnResult.success && bankResult.success) {
            await User.findByIdAndUpdate(req.user.id, {
              'kycData.bvn': {
                number: bvn,
                verified: true,
                verificationResult: bvnResult.data,
                verifiedAt: new Date()
              },
              'kycData.bankAccount': {
                accountNumber,
                bankCode,
                bankName: bankResult.data.bank,
                accountName: bankResult.data.account_name,
                verified: true,
                verificationResult: bankResult.data,
                verifiedAt: new Date()
              },
              'kycData.submittedAt': new Date(),
              kycStatus: 'pending'
            });
          }
        } else {
          console.log('⚠️ PaystackService not available, skipping KYC verification');
        }
      } catch (kycError) {
        console.error('Optional KYC processing error (continuing without KYC):', kycError.message);
        // Don't throw the error, just log it and continue
      }
    }

    // Calculate loan terms (using a default interest rate)
    const interestRate = 8; // Default 8% interest rate
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = durationMonths;
    
    let monthlyPayment, totalRepayment, totalInterest;
    
    if (monthlyRate > 0) {
      monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = amount / numberOfPayments;
    }
    
    totalRepayment = monthlyPayment * numberOfPayments;
    totalInterest = totalRepayment - amount;

    // Find the most recent collateral verification for this user
    const Collateral = require('../models/Collateral');
    const userCollateral = await Collateral.findOne({
      userId: req.user.id,
      verificationStatus: 'approved'
    }).sort({ approvedAt: -1 });

    // Create loan application with error handling
    console.log('📝 Creating loan application (general) with data:', {
      borrower: req.user.id,
      loanAmount: amount,
      purpose,
      duration: durationMonths,
      status: 'pending',
      hasCollateralVerification: !!userCollateral
    });

    let loan;
    try {
      // Build loan data object
      const loanData = {
        borrower: req.user.id,
        loanAmount: amount,
        purpose,
        purposeDescription: `Loan application for ${purpose} - ${collateral || 'No collateral provided'}`,
        duration: numberOfPayments,
        interestRate: interestRate,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalRepayment: Math.round(totalRepayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        amountRemaining: Math.round(totalRepayment * 100) / 100,
        collateral: collateral ? (typeof collateral === 'object' ? {
          type: collateral.type || 'other',
          description: collateral.description || 'No description provided',
          estimatedValue: collateral.estimatedValue || 0,
          documents: collateral.documents || []
        } : {
          type: 'other',
          description: collateral
        }) : null,
        status: 'pending',
        kycStatus: req.user.kycVerified ? 'verified' : 'pending',
        fundingProgress: {
          targetAmount: amount,
          fundedAmount: 0
        },
        submittedAt: new Date()
      };

      // Only add collateralVerification if userCollateral exists
      if (userCollateral) {
        loanData.collateralVerification = {
          id: userCollateral._id,
          type: userCollateral.collateralType,
          description: userCollateral.description,
          estimatedValue: userCollateral.estimatedValue,
          documents: userCollateral.collateralDocuments || [],
          bankStatement: userCollateral.bankStatement,
          bvn: userCollateral.bvn,
          verificationStatus: userCollateral.verificationStatus,
          approvedAt: userCollateral.approvedAt
        };
      }

      loan = await Loan.create(loanData);
      
      console.log('✅ Loan created successfully:', {
        id: loan._id,
        status: loan.status,
        borrower: loan.borrower,
        amount: loan.loanAmount,
        purpose: loan.purpose
      });
    } catch (loanError) {
      console.error('❌ Loan creation failed:', loanError);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to create loan application',
        error: loanError.message,
        details: loanError.errors || 'Validation error'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Loan application submitted successfully',
      data: {
        loan: {
          id: loan._id,
          loanAmount: loan.loanAmount,
          purpose: loan.purpose,
          status: loan.status,
          kycStatus: loan.kycStatus
        }
      }
    });

  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit loan application',
      error: error.message
    });
  }
});

// @desc    Check Paystack service status before KYC submission
// @route   GET /api/borrower/kyc/status
// @access  Private (Borrowers only)
router.get('/kyc/status', protect, async (req, res) => {
  try {
    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    console.log('🔍 Checking Paystack service status for user:', req.user.id);
    
    const serviceStatus = await PaystackService.checkServiceStatus();
    
    res.status(200).json({
      status: 'success',
      data: {
        paystackService: serviceStatus,
        canProceed: serviceStatus.success && serviceStatus.bvnService === 'available',
        message: serviceStatus.message,
        estimatedRecovery: serviceStatus.estimatedRecovery,
        contact: serviceStatus.contact
      }
    });

  } catch (error) {
    console.error('Service status check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check service status',
      error: error.message
    });
  }
});

// @desc    Submit KYC verification
// @route   POST /api/borrower/kyc
// @access  Private (Borrowers only)
router.post('/kyc', protect, async (req, res) => {
  try {
    console.log('📝 KYC submission request received:', {
      userId: req.user.id,
      userType: req.user.userType,
      bvn: req.body.bvn ? req.body.bvn.substring(0, 3) + '***' : 'not provided',
      accountNumber: req.body.accountNumber ? req.body.accountNumber.substring(0, 3) + '***' : 'not provided',
      bankCode: req.body.bankCode
    });

    const { bvn, accountNumber, bankCode } = req.body;

    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      console.log('❌ User type check failed:', req.user.userType);
      return res.status(403).json({
        status: 'error',
        message: 'Only borrowers can submit KYC'
      });
    }

    // Validate required fields
    if (!bvn || !accountNumber || !bankCode) {
      console.log('❌ Missing required fields:', { bvn: !!bvn, accountNumber: !!accountNumber, bankCode: !!bankCode });
      return res.status(400).json({
        status: 'error',
        message: 'BVN, account number, and bank code are required'
      });
    }

    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(bvn)) {
      console.log('❌ Invalid BVN format:', bvn);
      return res.status(400).json({
        status: 'error',
        message: 'BVN must be exactly 11 digits'
      });
    }

    // Validate account number format (minimum 10 digits)
    if (!/^\d{10,}$/.test(accountNumber)) {
      console.log('❌ Invalid account number format:', accountNumber);
      return res.status(400).json({
        status: 'error',
        message: 'Account number must be at least 10 digits'
      });
    }

    console.log('🔍 Starting Paystack verification...');

    // Verify BVN with Paystack
    console.log('🔍 Verifying BVN...');
    const bvnResult = await PaystackService.verifyBVN(bvn);
    console.log('📡 BVN verification result:', bvnResult);
    
    if (!bvnResult.success) {
      console.log('❌ BVN verification failed:', bvnResult.message);
      
      // Handle specific error types with appropriate status codes
      if (bvnResult.errorCode === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          status: 'error',
          message: bvnResult.message,
          errorCode: bvnResult.errorCode,
          retryAfter: bvnResult.retryAfter,
          alternativeMessage: bvnResult.alternativeMessage,
          suggestion: 'Please try again later or contact our support team for assistance.'
        });
      }
      
      if (bvnResult.errorCode === 'RATE_LIMITED') {
        return res.status(429).json({
          status: 'error',
          message: bvnResult.message,
          errorCode: bvnResult.errorCode,
          retryAfter: bvnResult.retryAfter,
          suggestion: 'Please wait before attempting verification again.'
        });
      }
      
      if (bvnResult.errorCode === 'SERVER_ERROR') {
        return res.status(503).json({
          status: 'error',
          message: bvnResult.message,
          errorCode: bvnResult.errorCode,
          retryAfter: bvnResult.retryAfter,
          suggestion: 'This is a temporary issue. Please try again later.'
        });
      }
      
      return res.status(400).json({
        status: 'error',
        message: `BVN verification failed: ${bvnResult.message}`,
        errorCode: bvnResult.errorCode || 'VERIFICATION_FAILED'
      });
    }

    // Verify bank account with Paystack
    console.log('🔍 Verifying bank account...');
    const bankResult = await PaystackService.verifyBankAccount(accountNumber, bankCode);
    console.log('📡 Bank verification result:', bankResult);
    
    if (!bankResult.success) {
      console.log('❌ Bank account verification failed:', bankResult.message);
      
      // Handle specific error types with appropriate status codes
      if (bankResult.errorCode === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          status: 'error',
          message: bankResult.message,
          errorCode: bankResult.errorCode,
          retryAfter: bankResult.retryAfter,
          alternativeMessage: bankResult.alternativeMessage,
          suggestion: 'Please try again later or contact our support team for assistance.'
        });
      }
      
      if (bankResult.errorCode === 'RATE_LIMITED') {
        return res.status(429).json({
          status: 'error',
          message: bankResult.message,
          errorCode: bankResult.errorCode,
          retryAfter: bankResult.retryAfter,
          suggestion: 'Please wait before attempting verification again.'
        });
      }
      
      if (bankResult.errorCode === 'SERVER_ERROR') {
        return res.status(503).json({
          status: 'error',
          message: bankResult.message,
          errorCode: bankResult.errorCode,
          retryAfter: bankResult.retryAfter,
          suggestion: 'This is a temporary issue. Please try again later.'
        });
      }
      
      return res.status(400).json({
        status: 'error',
        message: `Bank account verification failed: ${bankResult.message}`,
        errorCode: bankResult.errorCode || 'VERIFICATION_FAILED'
      });
    }

    console.log('✅ Both verifications successful, updating user...');

    // Update user with KYC data
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        'kycData.bvn': {
          number: bvn,
          verified: true,
          verificationResult: bvnResult.data,
          verifiedAt: new Date()
        },
        'kycData.bankAccount': {
          accountNumber,
          bankCode,
          bankName: bankResult.data.bank,
          accountName: bankResult.data.account_name,
          verified: true,
          verificationResult: bankResult.data,
          verifiedAt: new Date()
        },
        'kycData.submittedAt': new Date(),
        kycStatus: 'pending'
      },
      { new: true }
    );

    console.log('✅ User updated successfully with KYC data');

    res.status(200).json({
      status: 'success',
      message: 'KYC submitted successfully and is under review',
      data: {
        kycStatus: updatedUser.kycStatus,
        submittedAt: updatedUser.kycData.submittedAt
      }
    });

  } catch (error) {
    console.error('❌ KYC submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit KYC',
      error: error.message
    });
  }
 });

// @desc    Get borrower's KYC status
// @route   GET /api/borrower/kyc
// @access  Private (Borrowers only)
router.get('/kyc', protect, async (req, res) => {
  try {
    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.user.id).select('kycStatus kycVerified kycData');

    res.status(200).json({
      status: 'success',
      data: {
        kycStatus: user.kycStatus,
        kycVerified: user.kycVerified,
        kycData: user.kycData
      }
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
});

// @desc    Get list of banks
// @route   GET /api/borrower/banks
// @access  Private
router.get('/banks', protect, async (req, res) => {
  try {
    const banksResult = await PaystackService.getBanks();
    
    if (banksResult.success) {
      res.status(200).json({
        status: 'success',
        data: {
          banks: banksResult.data
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: banksResult.message
      });
    }

  } catch (error) {
    console.error('Get banks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get banks',
      error: error.message
    });
  }
});

// @desc    Test Paystack connection
// @route   GET /api/borrower/test-paystack
// @access  Private
router.get('/test-paystack', protect, async (req, res) => {
  try {
    console.log('🧪 Testing Paystack connection...');
    const testResult = await PaystackService.testConnection();
    
    if (testResult.success) {
      res.status(200).json({
        status: 'success',
        message: testResult.message
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: testResult.message
      });
    }

  } catch (error) {
    console.error('Paystack test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test Paystack connection',
      error: error.message
    });
  }
});

// ==================== WALLET ENDPOINTS ====================

// @desc    Create wallet for borrower
// @route   POST /api/borrower/wallet/create
// @access  Private (Borrowers only)
router.post('/wallet/create', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Only borrowers can create borrower wallets'
      });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ user: userId });
    if (existingWallet) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet already exists for this borrower'
      });
    }

    // Create new wallet with default borrower balance
    const wallet = await Wallet.create({
      user: userId,
      balance: 0, // Default borrower balance
      currency: 'USD'
    });

    res.status(201).json({
      status: 'success',
      message: 'Borrower wallet created successfully',
      data: {
        wallet: {
          id: wallet._id,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating borrower wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create borrower wallet'
    });
  }
});

// @desc    Get borrower wallet balance with loan statistics
// @route   GET /api/borrower/wallet/balance-with-stats
// @access  Private (Borrowers only)
router.get('/wallet/balance-with-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Only borrowers can access borrower wallet statistics'
      });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower wallet not found'
      });
    }

    // Get loan statistics for this borrower
    const Loan = require('../models/Loan');
    const loanStats = await Loan.aggregate([
      {
        $match: { borrower: userId }
      },
      {
        $group: {
          _id: null,
          totalBorrowed: { $sum: '$loanAmount' },
          totalRepaid: { $sum: '$amountPaid' },
          totalRemaining: { $sum: '$amountRemaining' },
          activeLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          completedLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          pendingLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = loanStats[0] || {
      totalBorrowed: 0,
      totalRepaid: 0,
      totalRemaining: 0,
      activeLoans: 0,
      completedLoans: 0,
      pendingLoans: 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
          totalDeposits: wallet.stats.totalDeposits,
          totalWithdrawals: wallet.stats.totalWithdrawals,
          transactionCount: wallet.stats.transactionCount
        },
        loanStats: {
          totalBorrowed: stats.totalBorrowed,
          totalRepaid: stats.totalRepaid,
          totalRemaining: stats.totalRemaining,
          activeLoans: stats.activeLoans,
          completedLoans: stats.completedLoans,
          pendingLoans: stats.pendingLoans
        },
        recentTransactions: wallet.transactions.slice(-5).map(t => ({
          type: t.type,
          amount: t.amount,
          description: t.description,
          reference: t.reference,
          createdAt: t.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching borrower wallet with stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch borrower wallet and loan statistics'
    });
  }
});

// @desc    Get borrower wallet balance
// @route   GET /api/borrower/wallet/balance
// @access  Private (Borrowers only)
router.get('/wallet/balance', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Borrower wallet endpoint - User ID:', userId);
    console.log('🔍 Borrower wallet endpoint - User email:', req.user.email);
    console.log('🔍 Borrower wallet endpoint - User type:', req.user.userType);

    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Only borrowers can access borrower wallet'
      });
    }

    const wallet = await Wallet.findOne({ user: userId })
      .populate('user', 'firstName lastName email userType');

    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower wallet not found'
      });
    }

    console.log('🔍 Borrower wallet balance for user', userId, ':', wallet.balance);

    res.status(200).json({
      status: 'success',
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        limits: wallet.limits,
        stats: wallet.stats
      }
    });

  } catch (error) {
    console.error('Error fetching borrower wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch borrower wallet details'
    });
  }
});

// @desc    Make a manual loan repayment
// @route   POST /api/borrower/repay-loan/:loanId
// @access  Private (Borrowers only)
router.post('/repay-loan/:loanId', protect, async (req, res) => {
  try {
    const loanId = req.params.loanId;
    const { installmentNumber } = req.body;

    // Check if user is a borrower
    if (req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Only borrowers can make loan repayments'
      });
    }

    // Find the loan
    const loan = await Loan.findById(loanId)
      .populate('borrowerId', 'email firstName lastName walletBalance')
      .populate('lenderId', 'email firstName lastName');

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Check if the borrower owns this loan
    if (loan.borrowerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only repay your own loans'
      });
    }

    // Check if loan is active
    if (loan.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is not active and cannot be repaid'
      });
    }

    // Find the specific installment to repay
    let repayment;
    if (installmentNumber) {
      repayment = loan.repayments.find(r => r.installmentNumber === installmentNumber && r.status === 'pending');
    } else {
      // Find the next due payment
      repayment = loan.repayments.find(r => r.status === 'pending');
    }

    if (!repayment) {
      return res.status(400).json({
        status: 'error',
        message: 'No pending repayment found for this loan'
      });
    }

    // Check if payment is overdue
    const isOverdue = repayment.dueDate < new Date();
    const daysOverdue = isOverdue ? 
      Math.floor((new Date() - repayment.dueDate) / (1000 * 60 * 60 * 24)) : 0;

    // Calculate late fee if applicable
    const repaymentService = require('../services/repaymentService');
    const lateFee = repaymentService.calculateLateFee(repayment.amount, daysOverdue);
    const totalAmount = repayment.amount + lateFee;

    // Check borrower's wallet balance
    const borrower = loan.borrowerId;
    if (borrower.walletBalance < totalAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient funds. Required: $${totalAmount.toFixed(2)}, Available: $${borrower.walletBalance.toFixed(2)}`
      });
    }

    // Process the repayment
    const result = await repaymentService.processLoanPayment(loan);

    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: 'Loan repayment processed successfully',
        data: {
          amount: result.amount,
          lateFee: result.lateFee,
          installmentNumber: repayment.installmentNumber,
          paymentId: result.paymentId,
          lender: {
            name: `${loan.lenderId.firstName} ${loan.lenderId.lastName}`,
            email: loan.lenderId.email
          }
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.error || 'Failed to process repayment'
      });
    }

  } catch (error) {
    console.error('Error processing loan repayment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process loan repayment'
    });
  }
});

module.exports = router;
