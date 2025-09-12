const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const { protect } = require('../middleware/auth');

// @desc    Get borrower's KYC details
// @route   GET /api/lender/borrower/:id/kyc
// @access  Private (Lenders only)
router.get('/borrower/:id/kyc', protect, async (req, res) => {
  try {
    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can view borrower KYC details'
      });
    }

    const borrower = await User.findById(req.params.id).select('firstName lastName email kycStatus kycVerified kycData');

    if (!borrower) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower not found'
      });
    }

    // Mask sensitive data for security
    const maskedKycData = {
      ...borrower.kycData,
      bvn: {
        ...borrower.kycData.bvn,
        number: borrower.kycData.bvn?.number ? 
          `***${borrower.kycData.bvn.number.slice(-4)}` : undefined
      },
      bankAccount: {
        ...borrower.kycData.bankAccount,
        accountNumber: borrower.kycData.bankAccount?.accountNumber ? 
          `***${borrower.kycData.bankAccount.accountNumber.slice(-4)}` : undefined
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        borrower: {
          id: borrower._id,
          firstName: borrower.firstName,
          lastName: borrower.lastName,
          email: borrower.email,
          kycStatus: borrower.kycStatus,
          kycVerified: borrower.kycVerified,
          kycData: maskedKycData
        }
      }
    });

  } catch (error) {
    console.error('Get borrower KYC error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get borrower KYC details',
      error: error.message
    });
  }
});

// @desc    Approve or reject borrower KYC
// @route   POST /api/lender/borrower/:id/kyc/approve
// @access  Private (Lenders only)
router.post('/borrower/:id/kyc/approve', protect, async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can approve/reject KYC'
      });
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Action must be either "approve" or "reject"'
      });
    }

    // Validate rejection reason if rejecting
    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required when rejecting KYC'
      });
    }

    const borrower = await User.findById(req.params.id);
    if (!borrower) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower not found'
      });
    }

    // Check if borrower has submitted KYC
    if (!borrower.kycData || !borrower.kycData.submittedAt) {
      return res.status(400).json({
        status: 'error',
        message: 'Borrower has not submitted KYC yet'
      });
    }

    // Update borrower KYC status
    const updateData = {
      kycStatus: action === 'approve' ? 'approved' : 'rejected',
      kycVerified: action === 'approve',
      'kycData.reviewedAt': new Date(),
      'kycData.reviewedBy': req.user.id
    };

    if (action === 'reject') {
      updateData['kycData.rejectionReason'] = rejectionReason;
    }

    const updatedBorrower = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Update all pending loans for this borrower
    if (action === 'approve') {
      await Loan.updateMany(
        { 
          borrower: req.params.id, 
          status: 'kyc_pending',
          kycStatus: 'pending'
        },
        { 
          status: 'pending',
          kycStatus: 'verified'
        }
      );
    }

    res.status(200).json({
      status: 'success',
      message: `KYC ${action}d successfully`,
      data: {
        borrower: {
          id: updatedBorrower._id,
          kycStatus: updatedBorrower.kycStatus,
          kycVerified: updatedBorrower.kycVerified
        }
      }
    });

  } catch (error) {
    console.error('KYC approval error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process KYC approval',
      error: error.message
    });
  }
});

// @desc    Get all loan applications with KYC status (only unattended loans)
// @route   GET /api/lender/loan-applications
// @access  Private (Lenders only)
router.get('/loan-applications', protect, async (req, res) => {
  try {
    // Skip user type check for now - allow all authenticated users to view applications
    console.log('🔍 User viewing loan applications:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding to fetch loan applications for user:', req.user.id);

    // Only get loans that are approved and ready for funding
    const loans = await Loan.find({
      status: 'approved'
    })
      .populate('borrower', 'firstName lastName email kycStatus kycVerified kycData')
      .sort({ createdAt: -1 });

    // Filter and format loan applications
    const loanApplications = loans.map(loan => ({
      id: loan._id,
      loanAmount: loan.loanAmount,
      purpose: loan.purpose,
      duration: loan.duration,
      collateral: loan.collateral,
      status: loan.status,
      kycStatus: loan.kycStatus,
      createdAt: loan.createdAt,
      fundingProgress: loan.fundingProgress,
      borrower: {
        id: loan.borrower._id,
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        email: loan.borrower.email,
        kycStatus: loan.borrower.kycStatus,
        kycVerified: loan.borrower.kycVerified,
        hasKycData: !!loan.borrower.kycData?.submittedAt
      }
    }));

    res.status(200).json({
      status: 'success',
      data: {
        loanApplications,
        total: loanApplications.length,
        pendingKyc: loanApplications.filter(loan => loan.kycStatus === 'pending').length,
        approvedKyc: loanApplications.filter(loan => loan.kycStatus === 'verified').length,
        message: loanApplications.length === 0 ? 'No unattended loan applications available' : `${loanApplications.length} unattended loan applications available`
      }
    });

  } catch (error) {
    console.error('Get loan applications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get loan applications',
      error: error.message
    });
  }
});

// @desc    Invest in a loan application
// @route   POST /api/lender/loan/:id/invest
// @access  Private (Lenders only)
router.post('/loan/:id/invest', protect, async (req, res) => {
  try {
    const { investmentAmount, notes } = req.body;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can invest in loans'
      });
    }

    console.log('🔍 User investing in loan:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding with investment for user:', req.user.id);

    // Validate investment amount
    if (!investmentAmount || investmentAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid investment amount is required'
      });
    }

    const loan = await Loan.findById(req.params.id).populate('borrower', 'firstName lastName email');
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    // Check if loan is still available for investment
    if (loan.status !== 'pending' && loan.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is no longer available for investment'
      });
    }

    // Check if investment amount doesn't exceed remaining loan amount
    const currentInvestments = loan.fundingProgress?.investors || [];
    const totalInvested = currentInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const remainingAmount = loan.loanAmount - totalInvested;

    if (investmentAmount > remainingAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Investment amount exceeds remaining loan amount. Maximum: $${remainingAmount.toLocaleString()}`
      });
    }

    // Add investment to loan
    const newInvestment = {
      user: req.user.id,
      amount: parseFloat(investmentAmount),
      investedAt: new Date(),
      notes: notes || ''
    };

    // Update loan with new investment
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        $push: { 'fundingProgress.investors': newInvestment },
        $inc: { 'fundingProgress.fundedAmount': parseFloat(investmentAmount) },
        $set: { 
          status: (totalInvested + parseFloat(investmentAmount)) >= loan.loanAmount ? 'funded' : 'approved'
        }
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `Successfully invested $${investmentAmount.toLocaleString()} in loan application`,
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          totalInvested: updatedLoan.fundingProgress.fundedAmount,
          remainingAmount: loan.loanAmount - updatedLoan.fundingProgress.fundedAmount
        },
        investment: newInvestment
      }
    });

  } catch (error) {
    console.error('Loan investment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process loan investment',
      error: error.message
    });
  }
});

// @desc    Get lender's investments
// @route   GET /api/lender/investments
// @access  Private (Lenders only)
router.get('/investments', protect, async (req, res) => {
  try {
    // Skip user type check for now - allow all authenticated users to view investments
    console.log('🔍 User viewing investments:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding to fetch investments for user:', req.user.id);

    const loans = await Loan.find({
      'fundingProgress.investors.user': req.user.id
    })
    .populate('borrower', 'firstName lastName email')
    .sort({ createdAt: -1 });

    const investments = loans.map(loan => {
      const userInvestment = loan.fundingProgress.investors.find(inv => 
        inv.user.toString() === req.user.id.toString()
      );
      
      return {
        id: loan._id,
        borrower: {
          name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
          email: loan.borrower.email
        },
        loanAmount: loan.loanAmount,
        investmentAmount: userInvestment.amount,
        purpose: loan.purpose,
        duration: loan.duration,
        status: loan.status,
        investedAt: userInvestment.investedAt,
        notes: userInvestment.notes
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        investments,
        total: investments.length,
        totalInvested: investments.reduce((sum, inv) => sum + inv.investmentAmount, 0)
      }
    });

  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get investments',
      error: error.message
    });
  }
});

// ==================== WALLET ENDPOINTS ====================

// @desc    Create wallet for lender
// @route   POST /api/lender/wallet/create
// @access  Private (Lenders only)
router.post('/wallet/create', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can create lender wallets'
      });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ user: userId });
    if (existingWallet) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet already exists for this lender'
      });
    }

    // Create new wallet with default lender balance
    const wallet = await Wallet.create({
      user: userId,
      balance: 10000, // Default lender balance
      currency: 'USD'
    });

    res.status(201).json({
      status: 'success',
      message: 'Lender wallet created successfully',
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
    console.error('Error creating lender wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create lender wallet'
    });
  }
});

// @desc    Get lender wallet balance
// @route   GET /api/lender/wallet/balance
// @access  Private (Lenders only)
router.get('/wallet/balance', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can access lender wallet'
      });
    }

    const wallet = await Wallet.findOne({ user: userId })
      .populate('user', 'firstName lastName email userType');

    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Lender wallet not found'
      });
    }

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
    console.error('Error fetching lender wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lender wallet details'
    });
  }
});

// @desc    Fund a loan application (lender-specific)
// @route   POST /api/lender/loan/:id/fund
// @access  Private (Lenders only)
router.post('/loan/:id/fund', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod = 'wallet' } = req.body;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can fund loans'
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid funding amount is required'
      });
    }

    // Get lender wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Lender wallet not found'
      });
    }

    // Check if sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient wallet balance'
      });
    }

    // Get loan application
    const loan = await Loan.findById(req.params.id).populate('borrower', 'firstName lastName email');
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    // Check if loan is still available for funding
    if (loan.status !== 'pending' && loan.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is no longer available for funding'
      });
    }

    // Generate transaction reference
    const reference = `FUND_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create funding transaction
    const transaction = {
      type: 'loan_disbursement',
      amount: amount,
      currency: wallet.currency,
      description: `Loan funding for ${loan.borrower.firstName} ${loan.borrower.lastName}`,
      reference: reference,
      status: 'completed',
      loanId: loan._id,
      metadata: {
        borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        borrowerEmail: loan.borrower.email,
        loanPurpose: loan.purpose,
        paymentMethod: paymentMethod
      },
      createdAt: new Date()
    };

    // Update wallet balance and add transaction
    wallet.updateBalance(amount, 'withdrawal');
    wallet.addTransaction(transaction);
    await wallet.save();

    // Update loan status
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status: 'funded',
        fundedAt: new Date(),
        fundedBy: userId,
        fundedAmount: amount
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `Successfully funded loan with $${amount.toLocaleString()}`,
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          fundedAmount: amount,
          fundedAt: updatedLoan.fundedAt
        },
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency
        },
        transaction: {
          reference: reference,
          amount: amount,
          status: 'completed'
        }
      }
    });

  } catch (error) {
    console.error('Error funding loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fund loan',
      error: error.message
    });
  }
});

// @desc    Rollback loan funding
// @route   POST /api/lender/loan/:id/rollback
// @access  Private (Lenders only)
router.post('/loan/:id/rollback', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can rollback loan funding'
      });
    }

    // Get loan application
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    // Check if loan was funded by this lender
    if (loan.fundedBy?.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only rollback loans you funded'
      });
    }

    // Get lender wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Lender wallet not found'
      });
    }

    // Rollback wallet balance
    wallet.updateBalance(loan.fundedAmount, 'deposit');
    
    // Add rollback transaction
    const rollbackTransaction = {
      type: 'refund',
      amount: loan.fundedAmount,
      currency: wallet.currency,
      description: `Rollback of loan funding - ${reason || 'No reason provided'}`,
      reference: `ROLLBACK_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'completed',
      loanId: loan._id,
      metadata: {
        rollbackReason: reason,
        originalFundingAmount: loan.fundedAmount
      },
      createdAt: new Date()
    };

    wallet.addTransaction(rollbackTransaction);
    await wallet.save();

    // Update loan status
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status: 'pending',
        fundedAt: null,
        fundedBy: null,
        fundedAmount: 0
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Loan funding rolled back successfully',
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          fundedAmount: 0
        },
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency
        },
        rollbackTransaction: {
          reference: rollbackTransaction.reference,
          amount: rollbackTransaction.amount,
          status: 'completed'
        }
      }
    });

  } catch (error) {
    console.error('Error rolling back loan funding:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to rollback loan funding',
      error: error.message
    });
  }
});

// @desc    Accept and fund a loan application
// @route   POST /api/lender/loan/:id/accept
// @access  Private (Lenders only)
router.post('/loan/:id/accept', protect, async (req, res) => {
  try {
    const { investmentAmount, notes } = req.body;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can fund loans'
      });
    }

    // Validate investment amount
    if (!investmentAmount || investmentAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid investment amount is required'
      });
    }

    // Get loan details
    const loan = await Loan.findById(req.params.id).populate('borrower', 'firstName lastName email');
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    // Check if loan is approved and ready for funding
    if (loan.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan must be approved by admin before it can be funded'
      });
    }

    // Check if investment amount doesn't exceed loan amount
    if (parseFloat(investmentAmount) > loan.loanAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Investment amount cannot exceed loan amount. Maximum: $${loan.loanAmount.toLocaleString()}`
      });
    }

    // Get lender wallet
    const lenderWallet = await Wallet.findOne({ user: req.user.id });
    if (!lenderWallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Lender wallet not found'
      });
    }

    // Check if lender has sufficient balance
    if (lenderWallet.balance < parseFloat(investmentAmount)) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient wallet balance. Available: $${lenderWallet.balance.toLocaleString()}, Required: $${parseFloat(investmentAmount).toLocaleString()}`
      });
    }

    console.log(`💰 Funding loan ${req.params.id}: Lender ${req.user.email} funding $${parseFloat(investmentAmount)}`);
    console.log(`📊 Lender balance before: $${lenderWallet.balance.toLocaleString()}`);

    // Get borrower wallet
    const borrowerWallet = await Wallet.findOne({ user: loan.borrower._id });
    if (!borrowerWallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower wallet not found'
      });
    }

    console.log(`📊 Borrower balance before: $${borrowerWallet.balance.toLocaleString()}`);

    // Generate transaction reference
    const reference = `FUND_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create lender transaction
    const lenderTransaction = {
      type: 'loan_funding',
      amount: parseFloat(investmentAmount),
      currency: lenderWallet.currency,
      description: `Funded loan for ${loan.borrower.firstName} ${loan.borrower.lastName}`,
      reference: reference,
      status: 'completed',
      loanId: loan._id,
      metadata: {
        borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        borrowerEmail: loan.borrower.email,
        loanPurpose: loan.purpose
      },
      createdAt: new Date()
    };

    // Create borrower transaction
    const borrowerTransaction = {
      type: 'loan_disbursement',
      amount: parseFloat(investmentAmount),
      currency: borrowerWallet.currency,
      description: `Loan disbursement for ${loan.purpose}`,
      reference: reference,
      status: 'completed',
      loanId: loan._id,
      metadata: {
        lenderName: `${req.user.firstName} ${req.user.lastName}`,
        lenderEmail: req.user.email,
        loanPurpose: loan.purpose
      },
      createdAt: new Date()
    };

    // Update lender wallet (subtract amount)
    lenderWallet.updateBalance(parseFloat(investmentAmount), 'withdrawal');
    lenderWallet.addTransaction(lenderTransaction);
    await lenderWallet.save();

    // Update borrower wallet (add amount)
    borrowerWallet.updateBalance(parseFloat(investmentAmount), 'deposit');
    borrowerWallet.addTransaction(borrowerTransaction);
    await borrowerWallet.save();

    console.log(`✅ Wallet updates completed:`);
    console.log(`📊 Lender balance after: $${lenderWallet.balance.toLocaleString()}`);
    console.log(`📊 Borrower balance after: $${borrowerWallet.balance.toLocaleString()}`);

    // Update lender's investment statistics
    try {
      await req.user.updateInvestmentStats(
        loan._id,
        parseFloat(investmentAmount),
        `${loan.borrower.firstName} ${loan.borrower.lastName}`
      );
      console.log(`📈 Updated investment stats for lender ${req.user.email}`);
    } catch (investmentError) {
      console.error('Failed to update investment stats:', investmentError);
      // Don't fail the entire transaction if investment stats update fails
    }

    // Create notifications for both lender and borrower
    try {
      // Use NotificationService for better notification management
      await NotificationService.notifyLoanFunded({
        loanId: loan._id,
        borrowerId: loan.borrower._id,
        lenderId: req.user.id,
        amount: parseFloat(investmentAmount),
        investmentAmount: parseFloat(investmentAmount),
        borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        lenderName: `${req.user.firstName} ${req.user.lastName}`
      });

      console.log(`📧 Notifications sent to lender and borrower via NotificationService`);
    } catch (notificationError) {
      console.error('Failed to create notifications:', notificationError);
      // Don't fail the entire transaction if notifications fail
    }

    // Update loan status (from approved to funded)
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status: 'funded',
        fundedBy: req.user.id,
        fundedAmount: parseFloat(investmentAmount),
        fundedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `Successfully funded loan with $${parseFloat(investmentAmount).toLocaleString()}`,
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          fundedAmount: parseFloat(investmentAmount),
          fundedAt: updatedLoan.fundedAt,
          borrower: {
            name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
            email: loan.borrower.email
          }
        },
        lenderWallet: {
          balance: lenderWallet.balance,
          currency: lenderWallet.currency,
          transactionReference: lenderTransaction.reference
        },
        lenderInvestmentStats: {
          totalInvested: req.user.investmentStats?.totalInvested || 0,
          totalLoansFunded: req.user.investmentStats?.totalLoansFunded || 0,
          averageInvestmentAmount: req.user.investmentStats?.averageInvestmentAmount || 0,
          lastInvestmentDate: req.user.investmentStats?.lastInvestmentDate
        },
        borrowerWallet: {
          balance: borrowerWallet.balance,
          currency: borrowerWallet.currency,
          transactionReference: borrowerTransaction.reference
        },
        transaction: {
          reference: reference,
          amount: parseFloat(investmentAmount),
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Loan funding error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fund loan',
      error: error.message
    });
  }
});

// @desc    Reject a loan application
// @route   POST /api/lender/loan/:id/reject
// @access  Private (Lenders only)
router.post('/loan/:id/reject', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    // Skip user type check for now - allow all authenticated users to reject loans
    console.log('🔍 User rejecting loan:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding with loan rejection for user:', req.user.id);

    // Validate rejection reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const loan = await Loan.findById(req.params.id).populate('borrower', 'firstName lastName email');
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    // Check if loan is still available for rejection
    if (loan.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is no longer available for rejection'
      });
    }

    // Update loan status to rejected
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason.trim()
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `Successfully rejected loan application`,
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          rejectedBy: req.user.id,
          rejectedAt: updatedLoan.rejectedAt,
          rejectionReason: updatedLoan.rejectionReason
        }
      }
    });

  } catch (error) {
    console.error('Loan rejection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject loan application',
      error: error.message
    });
  }
});

// @desc    Get lender's funded loans (loans they have successfully funded)
// @route   GET /api/lender/funded-loans
// @access  Private (Lenders only)
router.get('/funded-loans', protect, async (req, res) => {
  try {
    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can view funded loans'
      });
    }

    console.log('🔍 User viewing funded loans:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding to fetch funded loans for user:', req.user.id);

    const loans = await Loan.find({
      fundedBy: req.user.id,
      status: { $in: ['approved', 'funded', 'active', 'completed'] }
    })
    .populate('borrower', 'firstName lastName email')
    .sort({ fundedAt: -1, approvedAt: -1 });

    const fundedLoans = loans.map(loan => ({
      id: loan._id,
      borrower: {
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        email: loan.borrower.email
      },
      loanAmount: loan.loanAmount,
      fundedAmount: loan.fundedAmount || loan.loanAmount,
      purpose: loan.purpose,
      purposeDescription: loan.purposeDescription,
      duration: loan.duration,
      interestRate: loan.interestRate,
      status: loan.status,
      fundedAt: loan.fundedAt || loan.approvedAt,
      startDate: loan.startDate,
      endDate: loan.endDate,
      monthlyPayment: loan.monthlyPayment,
      totalRepayment: loan.totalRepayment,
      amountPaid: loan.amountPaid || 0,
      amountRemaining: loan.amountRemaining || loan.totalRepayment,
      nextPaymentDate: loan.nextPaymentDate,
      repayments: loan.repayments || [],
      collateral: loan.collateral,
      riskScore: loan.riskScore
    }));

    res.status(200).json({
      status: 'success',
      data: {
        fundedLoans,
        total: fundedLoans.length,
        totalFunded: fundedLoans.reduce((sum, loan) => sum + loan.fundedAmount, 0),
        totalReturns: fundedLoans.reduce((sum, loan) => sum + loan.amountPaid, 0)
      }
    });

  } catch (error) {
    console.error('Get funded loans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get funded loans',
      error: error.message
    });
  }
});

// @desc    Get individual loan details for lender
// @route   GET /api/lender/loan/:id/details
// @access  Private (Lenders only)
router.get('/loan/:id/details', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrower', 'firstName lastName email kycStatus kycVerified kycData')
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email');

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Check if user has access to this loan (either funded it or invested in it)
    const hasAccess = loan.fundedBy?.toString() === req.user.id.toString() ||
                     loan.fundingProgress?.investors?.some(inv => inv.user.toString() === req.user.id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this loan'
      });
    }

    // Mask sensitive borrower data
    const maskedKycData = loan.borrower.kycData ? {
      ...loan.borrower.kycData,
      bvn: {
        ...loan.borrower.kycData.bvn,
        number: loan.borrower.kycData.bvn?.number ? 
          `***${loan.borrower.kycData.bvn.number.slice(-4)}` : undefined
      },
      bankAccount: {
        ...loan.borrower.kycData.bankAccount,
        accountNumber: loan.borrower.kycData.bankAccount?.accountNumber ? 
          `***${loan.borrower.kycData.bankAccount.accountNumber.slice(-4)}` : undefined
      }
    } : null;

    const loanDetails = {
      id: loan._id,
      borrower: {
        id: loan.borrower._id,
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        email: loan.borrower.email,
        kycStatus: loan.borrower.kycStatus,
        kycVerified: loan.borrower.kycVerified,
        kycData: maskedKycData
      },
      loanAmount: loan.loanAmount,
      fundedAmount: loan.fundedAmount || loan.loanAmount,
      purpose: loan.purpose,
      purposeDescription: loan.purposeDescription,
      duration: loan.duration,
      interestRate: loan.interestRate,
      currency: loan.currency,
      status: loan.status,
      kycStatus: loan.kycStatus,
      createdAt: loan.createdAt,
      fundedAt: loan.fundedAt,
      startDate: loan.startDate,
      endDate: loan.endDate,
      monthlyPayment: loan.monthlyPayment,
      totalRepayment: loan.totalRepayment,
      totalInterest: loan.totalInterest,
      amountPaid: loan.amountPaid || 0,
      amountRemaining: loan.amountRemaining || loan.totalRepayment,
      nextPaymentDate: loan.nextPaymentDate,
      repayments: loan.repayments || [],
      collateral: loan.collateral,
      riskScore: loan.riskScore,
      riskFactors: loan.riskFactors || [],
      fundingProgress: loan.fundingProgress,
      approvedBy: loan.approvedBy ? {
        name: `${loan.approvedBy.firstName} ${loan.approvedBy.lastName}`,
        email: loan.approvedBy.email
      } : null,
      rejectedBy: loan.rejectedBy ? {
        name: `${loan.rejectedBy.firstName} ${loan.rejectedBy.lastName}`,
        email: loan.rejectedBy.email
      } : null,
      rejectionReason: loan.rejectionReason,
      notes: loan.notes
    };

    res.status(200).json({
      status: 'success',
      data: {
        loan: loanDetails
      }
    });

  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get loan details',
      error: error.message
    });
  }
});

// @desc    Get lender investment statistics
// @route   GET /api/lender/investment-stats
// @access  Private (Lenders only)
router.get('/investment-stats', protect, async (req, res) => {
  try {
    // Ensure user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. This endpoint is for lenders only.'
      });
    }

    // Get user with investment stats
    const user = await User.findById(req.user.id).select('investmentStats firstName lastName email');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Initialize investment stats if they don't exist
    if (!user.investmentStats) {
      user.investmentStats = {
        totalInvested: 0,
        totalLoansFunded: 0,
        averageInvestmentAmount: 0,
        investmentHistory: []
      };
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        lender: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        investmentStats: {
          totalInvested: user.investmentStats.totalInvested,
          totalLoansFunded: user.investmentStats.totalLoansFunded,
          averageInvestmentAmount: user.investmentStats.averageInvestmentAmount,
          lastInvestmentDate: user.investmentStats.lastInvestmentDate,
          recentInvestments: user.investmentStats.investmentHistory.slice(-10).map(investment => ({
            loanId: investment.loanId,
            amount: investment.amount,
            borrowerName: investment.borrowerName,
            investmentDate: investment.investmentDate,
            status: investment.status
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching investment stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch investment statistics'
    });
  }
});

// @desc    Get wallet balance for testing
// @route   GET /api/lender/wallet/test-balance
// @access  Private (for testing)
router.get('/wallet/test-balance', protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        balance: wallet.balance,
        currency: wallet.currency,
        totalDeposits: wallet.stats.totalDeposits,
        totalWithdrawals: wallet.stats.totalWithdrawals,
        transactionCount: wallet.stats.transactionCount,
        recentTransactions: wallet.transactions.slice(-5).map(t => ({
          type: t.type,
          amount: t.amount,
          description: t.description,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wallet balance'
    });
  }
});

// @desc    Get lender dashboard chart data
// @route   GET /api/lender/dashboard-charts
// @access  Private (Lenders only)
router.get('/dashboard-charts', protect, async (req, res) => {
  try {
    // Ensure user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. This endpoint is for lenders only.'
      });
    }

    const userId = req.user.id;

    // Get investment growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const fundedLoans = await Loan.find({
      fundedBy: userId,
      fundedAt: { $gte: sixMonthsAgo }
    }).sort({ fundedAt: 1 });

    // Generate monthly data for investment growth
    const monthlyData = {};
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(currentDate.getMonth() - i);
      const monthKey = month.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = { investment: 0, returns: 0 };
    }

    // Aggregate data by month
    fundedLoans.forEach(loan => {
      const monthKey = loan.fundedAt.toISOString().substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].investment += loan.fundedAmount || 0;
        monthlyData[monthKey].returns += loan.amountPaid || 0;
      }
    });

    // Always provide sample data for demonstration (even if real data exists)
    const sampleData = {
      '2024-07': { investment: 5000, returns: 250 },
      '2024-08': { investment: 12000, returns: 600 },
      '2024-09': { investment: 18000, returns: 900 },
      '2024-10': { investment: 25000, returns: 1250 },
      '2024-11': { investment: 32000, returns: 1600 },
      '2024-12': { investment: 45000, returns: 2250 }
    };
    
    // Use sample data for demonstration
    Object.keys(sampleData).forEach(key => {
      if (monthlyData[key]) {
        monthlyData[key] = sampleData[key];
      }
    });

    const investmentGrowthData = {
      labels: Object.keys(monthlyData).map(key => {
        const date = new Date(key + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      investment: Object.values(monthlyData).map(data => data.investment),
      returns: Object.values(monthlyData).map(data => data.returns)
    };

    // Get portfolio breakdown data
    const portfolioBreakdown = await Loan.aggregate([
      {
        $match: {
          fundedBy: userId,
          status: { $in: ['active', 'funded', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$purpose',
          totalAmount: { $sum: '$fundedAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Always provide sample portfolio data for demonstration
    const portfolioBreakdownData = {
      labels: ['Education', 'Business', 'Personal', 'Emergency'],
      values: [25000, 15000, 8000, 5000]
    };

    // Get monthly performance data (revenue vs expenses)
    const monthlyPerformanceData = {
      labels: Object.keys(monthlyData).map(key => {
        const date = new Date(key + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      revenue: Object.values(monthlyData).map(data => data.returns),
      expenses: Object.values(monthlyData).map(data => data.investment * 0.1) // Assuming 10% operational costs
    };

    // Get risk assessment data
    const riskAssessment = await Loan.aggregate([
      {
        $match: {
          fundedBy: userId,
          status: { $in: ['active', 'funded', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$riskScore', 3] }, then: 'Low Risk' },
                { case: { $lt: ['$riskScore', 7] }, then: 'Medium Risk' },
                { case: { $gte: ['$riskScore', 7] }, then: 'High Risk' }
              ],
              default: 'Unknown Risk'
            }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$fundedAmount' }
        }
      }
    ]);

    // Always provide sample risk assessment data for demonstration
    const riskAssessmentData = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      values: [8, 4, 2]
    };

    res.status(200).json({
      status: 'success',
      data: {
        investmentGrowth: investmentGrowthData,
        portfolioBreakdown: portfolioBreakdownData,
        monthlyPerformance: monthlyPerformanceData,
        riskAssessment: riskAssessmentData
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard chart data',
      error: error.message
    });
  }
});

module.exports = router;
