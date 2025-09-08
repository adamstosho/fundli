const Loan = require('../models/Loan');
const User = require('../models/User');
const ReferralService = require('../services/referralService');

// Apply for a loan
const applyForLoan = async (req, res) => {
  try {
    const {
      amount,
      purpose,
      duration,
      repaymentSchedule,
      collateral,
      description
    } = req.body;

    const borrowerId = req.user.id;

    // Validate required fields
    if (!amount || !purpose || !duration || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'All required fields must be provided'
      });
    }

    // Check if user has completed KYC
    const user = await User.findById(borrowerId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // KYC verification is now optional - all users can apply for loans

    // Calculate loan terms (using a default interest rate based on credit score)
    const baseInterestRate = 8; // 8% base rate
    const creditScoreAdjustment = Math.max(0, (750 - user.creditScore) * 0.02); // Higher score = lower rate
    const interestRate = Math.max(5, baseInterestRate - creditScoreAdjustment); // Min 5%

    // Calculate monthly payment and total amounts
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = duration;
    
    let monthlyPayment, totalRepayment, totalInterest;
    
    if (monthlyRate > 0) {
      monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = amount / numberOfPayments;
    }
    
    totalRepayment = monthlyPayment * numberOfPayments;
    totalInterest = totalRepayment - amount;

    // Create loan application
    const loan = new Loan({
      borrower: borrowerId,
      loanAmount: amount,
      purpose,
      purposeDescription: description,
      duration,
      interestRate,
      repaymentSchedule: repaymentSchedule || 'monthly',
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      amountRemaining: Math.round(totalRepayment * 100) / 100,
      collateral: collateral ? {
        type: collateral.type || 'other',
        description: collateral.description || '',
        estimatedValue: collateral.estimatedValue || 0
      } : null,
      status: 'pending',
      submittedAt: new Date(),
      fundingProgress: {
        fundedAmount: 0,
        investors: [],
        targetAmount: amount
      }
    });

    await loan.save();

    // Track referral action for loan application
    try {
      await ReferralService.handlePlatformAction(borrowerId, 'loan_application', amount);
    } catch (referralError) {
      console.warn('Referral tracking error for loan application:', referralError.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Loan application submitted successfully',
      data: {
        loanId: loan._id,
        status: loan.status,
        submittedAt: loan.submittedAt
      }
    });

  } catch (error) {
    console.error('Error applying for loan:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit loan application'
    });
  }
};

// Get user's loans
const getUserLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    console.log('🔍 getUserLoans called for user:', userId);
    console.log('👤 User type:', userType);
    
    const loans = await Loan.find({ borrower: userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    console.log('📊 Found loans for user:', loans.length);
    loans.forEach((loan, index) => {
      console.log(`  ${index + 1}. ${loan.purpose} - ₦${loan.loanAmount} - ${loan.status}`);
    });

    res.status(200).json({
      status: 'success',
      data: {
        loans,
        total: loans.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user loans:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
};

// Get loan by ID
const getLoanById = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    let loan;
    
    // Borrowers can only access their own loans
    if (userType === 'borrower') {
      loan = await Loan.findOne({ _id: loanId, borrower: userId })
        .populate('borrower', 'firstName lastName email kycStatus');
    } 
    // Lenders and admins can access any loan
    else if (userType === 'lender' || userType === 'admin') {
      loan = await Loan.findById(loanId)
        .populate('borrower', 'firstName lastName email kycStatus kycVerified');
    } 
    else {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Format the response for lenders/admins
    if (userType === 'lender' || userType === 'admin') {
      const formattedLoan = {
        id: loan._id,
        loanAmount: loan.loanAmount,
        purpose: loan.purpose,
        purposeDescription: loan.purposeDescription,
        duration: loan.duration,
        interestRate: loan.interestRate,
        monthlyPayment: loan.monthlyPayment,
        totalRepayment: loan.totalRepayment,
        collateral: loan.collateral,
        status: loan.status,
        kycStatus: loan.kycStatus,
        createdAt: loan.createdAt,
        submittedAt: loan.submittedAt,
        fundingProgress: loan.fundingProgress,
        borrower: {
          id: loan.borrower._id,
          name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
          email: loan.borrower.email,
          kycStatus: loan.borrower.kycStatus,
          kycVerified: loan.borrower.kycVerified
        }
      };

      res.status(200).json({
        status: 'success',
        data: formattedLoan
      });
    } else {
      res.status(200).json({
        status: 'success',
        data: loan
      });
    }

  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loan details'
    });
  }
};

// Update loan application
const updateLoanApplication = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const loan = await Loan.findOne({ _id: loanId, borrower: userId });
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Only allow updates if loan is in draft or pending status
    if (!['draft', 'pending'].includes(loan.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update loan in current status'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['purpose', 'purposeDescription', 'duration', 'collateral'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        loan[field] = updateData[field];
      }
    });

    await loan.save();

    res.status(200).json({
      status: 'success',
      message: 'Loan application updated successfully',
      data: loan
    });

  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update loan application'
    });
  }
};

// Cancel loan application
const cancelLoanApplication = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await Loan.findOne({ _id: loanId, borrower: userId });
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    if (!['draft', 'pending'].includes(loan.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel loan in current status'
      });
    }

    loan.status = 'cancelled';
    await loan.save();

    res.status(200).json({
      status: 'success',
      message: 'Loan application cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel loan application'
    });
  }
};

// Get loan statistics
const getLoanStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Loan.aggregate([
      { $match: { borrower: userId } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalBorrowed: { $sum: '$loanAmount' },
          totalRepaid: { $sum: '$amountPaid' },
          activeLoans: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
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

    const loanStats = stats[0] || {
      totalLoans: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      activeLoans: 0,
      pendingLoans: 0
    };

    res.status(200).json({
      status: 'success',
      data: loanStats
    });

  } catch (error) {
    console.error('Error fetching loan stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loan statistics'
    });
  }
};

// Get pending loans for borrowers (their own loans)
const getPendingLoansForBorrower = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const pendingLoans = await Loan.find({ 
      borrower: userId, 
      status: 'pending' 
    })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      status: 'success',
      data: {
        loans: pendingLoans,
        total: pendingLoans.length
      }
    });

  } catch (error) {
    console.error('Error fetching pending loans for borrower:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending loans'
    });
  }
};

// Get all pending loans for lenders and admins
const getAllPendingLoans = async (req, res) => {
  try {
    const userType = req.user.userType;
    
    // Skip user type check for now - allow all authenticated users to view pending loans
    console.log('🔍 User viewing all pending loans:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding to fetch pending loans for user:', req.user.id);

    const pendingLoans = await Loan.find({ status: 'pending' })
      .populate('borrower', 'firstName lastName email kycStatus kycVerified')
      .sort({ createdAt: -1 })
      .select('-__v');

    // Format the response
    const formattedLoans = pendingLoans.map(loan => ({
      id: loan._id,
      loanAmount: loan.loanAmount,
      purpose: loan.purpose,
      purposeDescription: loan.purposeDescription,
      duration: loan.duration,
      interestRate: loan.interestRate,
      monthlyPayment: loan.monthlyPayment,
      totalRepayment: loan.totalRepayment,
      collateral: loan.collateral,
      status: loan.status,
      kycStatus: loan.kycStatus,
      createdAt: loan.createdAt,
      submittedAt: loan.submittedAt,
      fundingProgress: loan.fundingProgress,
      borrower: {
        id: loan.borrower._id,
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        email: loan.borrower.email,
        kycStatus: loan.borrower.kycStatus,
        kycVerified: loan.borrower.kycVerified
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
    console.error('Error fetching all pending loans:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending loans'
    });
  }
};

// Reject loan application
const rejectLoanApplication = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;
    const lenderId = req.user.id;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can reject loan applications'
      });
    }

    const loan = await Loan.findById(loanId).populate('borrower', 'firstName lastName email');
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot reject loan in current status'
      });
    }

    // Update loan status
    loan.status = 'rejected';
    loan.rejectionReason = reason || 'No reason provided';
    loan.rejectedBy = lenderId;
    loan.rejectedAt = new Date();
    
    await loan.save();

    // TODO: Send notification to borrower
    // await sendNotification(loan.borrower._id, {
    //   type: 'loan_rejected',
    //   message: `Your loan application for $${loan.loanAmount} has been rejected.`,
    //   reason: reason
    // });

    res.status(200).json({
      status: 'success',
      message: 'Loan application rejected successfully',
      data: {
        loanId: loan._id,
        status: loan.status,
        rejectionReason: loan.rejectionReason
      }
    });

  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject loan application'
    });
  }
};

// Accept loan application (after payment)
const acceptLoanApplication = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { paymentReference, amount } = req.body;
    const lenderId = req.user.id;

    // Skip user type check for now - allow all authenticated users to accept loans
    console.log('🔍 User accepting loan:', req.user.email, 'UserType:', req.user.userType);
    console.log('✅ Proceeding to accept loan for user:', req.user.id);

    const loan = await Loan.findById(loanId).populate('borrower', 'firstName lastName email');
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot accept loan in current status'
      });
    }

    // Check lender's wallet balance
    const Wallet = require('../models/Wallet');
    const lenderWallet = await Wallet.findOne({ user: lenderId });
    
    if (!lenderWallet) {
      return res.status(400).json({
        status: 'error',
        message: 'Lender wallet not found. Please create a wallet first.'
      });
    }

    // Check if lender has sufficient balance
    if (lenderWallet.balance < loan.loanAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance',
        data: {
          required: loan.loanAmount,
          available: lenderWallet.balance,
          shortfall: loan.loanAmount - lenderWallet.balance
        }
      });
    }

    // Update loan status to 'approved' (accepted by lender)
    loan.status = 'approved';
    loan.approvedBy = lenderId;
    loan.approvedAt = new Date();
    loan.fundingProgress.fundedAmount = loan.loanAmount;
    loan.fundingProgress.investors.push({
      user: lenderId,
      amount: loan.loanAmount,
      investedAt: new Date()
    });

    // If fully funded, change status to 'funded'
    if (loan.fundingProgress.fundedAmount >= loan.loanAmount) {
      loan.status = 'funded';
      loan.fundedAt = new Date();
    }

    await loan.save();

    // Deduct amount from lender's wallet
    const transactionReference = `LOAN_FUNDING_${loanId}_${Date.now()}`;
    const fundingTransaction = {
      type: 'loan_payment',
      amount: loan.loanAmount,
      currency: 'NGN',
      description: `Funding for loan ${loanId}`,
      reference: transactionReference,
      status: 'completed',
      loanId: loanId,
      metadata: {
        loanId: loanId,
        borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        borrowerEmail: loan.borrower.email,
        paymentReference: paymentReference
      },
      createdAt: new Date()
    };

    lenderWallet.addTransaction(fundingTransaction);
    lenderWallet.updateBalance(loan.loanAmount, 'subtract');
    await lenderWallet.save();

    // Add loan disbursement to borrower's wallet
    const borrowerWallet = await Wallet.findOne({ user: loan.borrower._id });
    if (borrowerWallet) {
      const disbursementTransaction = {
        type: 'loan_disbursement',
        amount: loan.loanAmount,
        currency: 'NGN',
        description: `Loan disbursement for ${loan.purpose}`,
        reference: `LOAN_DISBURSEMENT_${loanId}_${Date.now()}`,
        status: 'completed',
        loanId: loanId,
        metadata: {
          loanId: loanId,
          lenderName: `${req.user.firstName} ${req.user.lastName}`,
          lenderEmail: req.user.email
        },
        createdAt: new Date()
      };

      borrowerWallet.addTransaction(disbursementTransaction);
      borrowerWallet.updateBalance(loan.loanAmount, 'add');
      await borrowerWallet.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Loan accepted and funded successfully',
      data: {
        loanId: loan._id,
        status: loan.status,
        fundedAmount: loan.fundingProgress.fundedAmount,
        lenderBalance: lenderWallet.balance,
        borrowerBalance: borrowerWallet?.balance || 0,
        transactionReference: transactionReference
      }
    });

  } catch (error) {
    console.error('Error accepting loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to accept loan application'
    });
  }
};

module.exports = {
  applyForLoan,
  getUserLoans,
  getLoanById,
  updateLoanApplication,
  cancelLoanApplication,
  getLoanStats,
  getPendingLoansForBorrower,
  getAllPendingLoans,
  rejectLoanApplication,
  acceptLoanApplication
}; 