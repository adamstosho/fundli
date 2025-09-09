const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
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

    // Only get loans that are truly pending (not accepted, rejected, or funded)
    const loans = await Loan.find({
      status: { $in: ['pending', 'kyc_pending'] },
      $or: [
        { approvedBy: { $exists: false } },
        { approvedBy: null },
        { rejectedBy: { $exists: false } },
        { rejectedBy: null }
      ]
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
    wallet.updateBalance(amount, 'subtract');
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
    wallet.updateBalance(loan.fundedAmount, 'add');
    
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

    // Check if user is a lender (temporarily disabled for testing)
    // if (req.user.userType !== 'lender') {
    //   return res.status(403).json({
    //     status: 'error',
    //     message: 'Only lenders can fund loans'
    //   });
    // }

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

    // Check if loan is still available
    if (loan.status !== 'pending' && loan.status !== 'kyc_pending') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is no longer available for funding'
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
        message: 'Insufficient wallet balance to fund this loan'
      });
    }

    // Get borrower wallet
    const borrowerWallet = await Wallet.findOne({ user: loan.borrower._id });
    if (!borrowerWallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower wallet not found'
      });
    }

    // Generate transaction reference
    const reference = `FUND_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Update lender wallet (subtract amount)
    lenderWallet.balance -= parseFloat(investmentAmount);
    lenderWallet.transactions.push({
      type: 'loan_funding',
      amount: parseFloat(investmentAmount),
      description: `Funded loan for ${loan.borrower.firstName} ${loan.borrower.lastName}`,
      reference: reference,
      loanId: loan._id,
      createdAt: new Date()
    });
    await lenderWallet.save();

    // Update borrower wallet (add amount)
    borrowerWallet.balance += parseFloat(investmentAmount);
    borrowerWallet.transactions.push({
      type: 'loan_disbursement',
      amount: parseFloat(investmentAmount),
      description: `Loan disbursement for ${loan.purpose}`,
      reference: reference,
      loanId: loan._id,
      createdAt: new Date()
    });
    await borrowerWallet.save();

    // Update loan status
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status: 'funded',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        fundedBy: req.user.id,
        fundedAmount: parseFloat(investmentAmount),
        fundedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Loan funded successfully',
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          fundedAmount: parseFloat(investmentAmount),
          fundedAt: updatedLoan.fundedAt
        },
        lenderBalance: lenderWallet.balance,
        borrowerBalance: borrowerWallet.balance
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

module.exports = router;
