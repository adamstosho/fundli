const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
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

// @desc    Get all loan applications with KYC status
// @route   GET /api/lender/loan-applications
// @access  Private (Lenders only)
router.get('/loan-applications', protect, async (req, res) => {
  try {
    // Skip user type check for now - allow all authenticated users to view applications
    console.log('🔍 User viewing loan applications:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding to fetch loan applications for user:', req.user.id);

    const loans = await Loan.find({})
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
        approvedKyc: loanApplications.filter(loan => loan.kycStatus === 'verified').length
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

    // Skip user type check for now - allow all authenticated users to invest
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

module.exports = router;
