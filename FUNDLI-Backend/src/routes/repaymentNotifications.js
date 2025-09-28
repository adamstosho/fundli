const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// @desc    Check and send repayment due notifications
// @route   POST /api/notifications/check-repayment-due
// @access  Private (Admin only)
router.post('/check-repayment-due', async (req, res) => {
  try {
    console.log('🔍 Checking for loans due for repayment...');
    
    // Find all active loans that are due for repayment
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find loans due today or in the next 7 days
    const loansDueSoon = await Loan.find({
      status: 'active',
      endDate: {
        $gte: today,
        $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    }).populate('borrower', 'firstName lastName email')
      .populate('fundedBy', 'firstName lastName email');

    console.log(`📊 Found ${loansDueSoon.length} loans due for repayment`);

    let notificationsSent = 0;

    for (const loan of loansDueSoon) {
      try {
        // Calculate days until due
        const daysUntilDue = Math.ceil((loan.endDate - today) / (1000 * 60 * 60 * 24));
        
        // Only send notification if it's due today or in the next 3 days
        if (daysUntilDue <= 3) {
          // Get the lender who funded this loan
          const lender = loan.fundedBy;
          if (lender) {
            await NotificationService.notifyRepaymentDue({
              lenderId: lender._id,
              lenderName: `${lender.firstName} ${lender.lastName}`,
              loanId: loan._id,
              borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
              loanAmount: loan.loanAmount,
              dueDate: loan.endDate,
              daysUntilDue: daysUntilDue
            });
            
            notificationsSent++;
            console.log(`📧 Repayment due notification sent to lender ${lender._id} for loan ${loan._id}`);
          }

          // Also send notification to admins about loan due for repayment
          try {
            await NotificationService.notifyAdminLoanDueForRepayment({
              loanId: loan._id,
              borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
              lenderName: `${lender.firstName} ${lender.lastName}`,
              loanAmount: loan.loanAmount,
              dueDate: loan.endDate,
              daysUntilDue: daysUntilDue
            });
            
            console.log(`📧 Repayment due notification sent to admins for loan ${loan._id}`);
          } catch (adminNotificationError) {
            console.error(`Error sending admin repayment due notification for loan ${loan._id}:`, adminNotificationError);
          }
        }
      } catch (notificationError) {
        console.error(`Error sending repayment due notification for loan ${loan._id}:`, notificationError);
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Repayment due check completed. ${notificationsSent} notifications sent.`,
      data: {
        loansChecked: loansDueSoon.length,
        notificationsSent: notificationsSent
      }
    });

  } catch (error) {
    console.error('Error checking repayment due notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check repayment due notifications',
      error: error.message
    });
  }
});

// @desc    Send test repayment due notification
// @route   POST /api/notifications/test-repayment-due
// @access  Private (Admin only)
router.post('/test-repayment-due', async (req, res) => {
  try {
    const { lenderId, loanId } = req.body;

    if (!lenderId || !loanId) {
      return res.status(400).json({
        status: 'error',
        message: 'lenderId and loanId are required'
      });
    }

    // Get lender and loan details
    const lender = await User.findById(lenderId);
    const loan = await Loan.findById(loanId).populate('borrower', 'firstName lastName email');

    if (!lender || !loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Lender or loan not found'
      });
    }

    // Calculate days until due
    const today = new Date();
    const daysUntilDue = Math.ceil((loan.endDate - today) / (1000 * 60 * 60 * 24));

    // Send test notification
    await NotificationService.notifyRepaymentDue({
      lenderId: lender._id,
      lenderName: `${lender.firstName} ${lender.lastName}`,
      loanId: loan._id,
      borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
      loanAmount: loan.loanAmount,
      dueDate: loan.endDate,
      daysUntilDue: daysUntilDue
    });

    res.status(200).json({
      status: 'success',
      message: 'Test repayment due notification sent successfully',
      data: {
        lenderId: lender._id,
        loanId: loan._id,
        daysUntilDue: daysUntilDue
      }
    });

  } catch (error) {
    console.error('Error sending test repayment due notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test repayment due notification',
      error: error.message
    });
  }
});

module.exports = router;
