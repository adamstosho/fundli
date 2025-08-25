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

    // Check if user needs KYC verification (admin users don't need KYC)
    if (user.userType !== 'admin' && user.kycStatus !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'KYC verification is required before applying for a loan'
      });
    }

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
      submittedAt: new Date()
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
    
    const loans = await Loan.find({ borrower: userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      status: 'success',
      data: {
        loans,
        total: loans.length
      }
    });

  } catch (error) {
    console.error('Error fetching user loans:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loans'
    });
  }
};

// Get loan by ID
const getLoanById = async (req, res) => {
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

    res.status(200).json({
      status: 'success',
      data: loan
    });

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

module.exports = {
  applyForLoan,
  getUserLoans,
  getLoanById,
  updateLoanApplication,
  cancelLoanApplication,
  getLoanStats
}; 