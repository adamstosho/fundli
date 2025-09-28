const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Create a notification for a user
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.recipientId - User ID to receive notification
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.priority - Priority level (low, normal, high, urgent)
   * @param {Object} notificationData.metadata - Additional metadata
   * @param {Object} notificationData.action - Action details
   * @param {Object} notificationData.relatedEntities - Related entities
   */
  static async createNotification(notificationData) {
    try {
      const {
        recipientId,
        type,
        title,
        message,
        priority = 'normal',
        metadata = {},
        action = {},
        relatedEntities = {},
        content = '',
        actionRequired = false
      } = notificationData;

      // Validate required fields
      if (!recipientId || !type || !title || !message) {
        throw new Error('recipientId, type, title, and message are required');
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new Error('Recipient user not found');
      }

      // Create notification
      const notification = await Notification.create({
        recipient: recipientId,
        type,
        title,
        message,
        content,
        priority,
        actionRequired,
        action,
        relatedEntities,
        metadata,
        channels: {
          inApp: true,
          email: false, // Can be enabled later
          push: false,  // Can be enabled later
          sms: false    // Can be enabled later
        }
      });

      console.log(`Notification created for user ${recipientId}: ${title}`);
      return notification;

    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications for multiple users
   * @param {Array} notifications - Array of notification data
   */
  static async createBulkNotifications(notifications) {
    try {
      const createdNotifications = [];
      
      for (const notificationData of notifications) {
        try {
          const notification = await this.createNotification(notificationData);
          createdNotifications.push(notification);
        } catch (error) {
          console.error(`Failed to create notification for user ${notificationData.recipientId}:`, error);
          // Continue with other notifications
        }
      }

      return createdNotifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification for loan application submission
   */
  static async notifyLoanApplicationSubmitted(loanData) {
    try {
      // Notify admin about new loan application
      const adminUsers = await User.find({ userType: 'admin' });
      
      const notifications = adminUsers.map(admin => ({
        recipientId: admin._id,
        type: 'loan_application',
        title: 'New Loan Application Submitted',
        message: `A new loan application has been submitted by ${loanData.borrowerName} for ₦${loanData.amount.toLocaleString()}`,
        priority: 'high',
        actionRequired: true,
        action: {
          type: 'view',
          url: `/admin/loans/${loanData.loanId}`,
          buttonText: 'Review Application'
        },
        relatedEntities: {
          loan: loanData.loanId,
          user: loanData.borrowerId
        },
        metadata: {
          amount: loanData.amount,
          currency: 'USD',
          borrowerName: loanData.borrowerName
        }
      }));

      await this.createBulkNotifications(notifications);
      
      // Notify borrower about successful submission
      await this.createNotification({
        recipientId: loanData.borrowerId,
        type: 'loan_application',
        title: 'Loan Application Submitted Successfully',
        message: `Your loan application for ₦${loanData.amount.toLocaleString()} has been submitted and is under review.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/borrower/loans/${loanData.loanId}`,
          buttonText: 'View Application'
        },
        relatedEntities: {
          loan: loanData.loanId
        },
        metadata: {
          amount: loanData.amount,
          currency: 'USD'
        }
      });

    } catch (error) {
      console.error('Error notifying loan application submission:', error);
    }
  }

  /**
   * Create notification for loan funding
   */
  static async notifyLoanFunded(loanData) {
    try {
      // Notify borrower
      await this.createNotification({
        recipientId: loanData.borrowerId,
        type: 'loan_funding',
        title: 'Loan Successfully Funded!',
        message: `Congratulations! Your loan application for ₦${loanData.amount.toLocaleString()} has been fully funded and is ready for disbursement.`,
        priority: 'high',
        action: {
          type: 'view',
          url: `/borrower/loans/${loanData.loanId}`,
          buttonText: 'View Loan Details'
        },
        relatedEntities: {
          loan: loanData.loanId
        },
        metadata: {
          amount: loanData.amount,
          currency: 'USD',
          fundedBy: loanData.lenderName
        }
      });

      // Notify lender
      await this.createNotification({
        recipientId: loanData.lenderId,
        type: 'loan_funding',
        title: 'Investment Successful',
        message: `Your investment of ₦${loanData.investmentAmount.toLocaleString()} has been successfully processed for ${loanData.borrowerName}'s loan.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/lender/investments/${loanData.loanId}`,
          buttonText: 'View Investment'
        },
        relatedEntities: {
          loan: loanData.loanId,
          user: loanData.borrowerId
        },
        metadata: {
          amount: loanData.investmentAmount,
          currency: 'USD',
          borrowerName: loanData.borrowerName
        }
      });

    } catch (error) {
      console.error('Error notifying loan funding:', error);
    }
  }

  /**
   * Create notification for KYC approval/rejection
   */
  static async notifyKYCDecision(kycData) {
    try {
      const isApproved = kycData.status === 'approved';
      
      await this.createNotification({
        recipientId: kycData.userId,
        type: isApproved ? 'kyc_approval' : 'kyc_rejection',
        title: isApproved ? 'KYC Verification Approved' : 'KYC Verification Rejected',
        message: isApproved 
          ? `Congratulations! Your KYC verification has been approved. You can now apply for loans.`
          : `Your KYC verification has been rejected. Reason: ${kycData.rejectionReason || 'Please contact support for details.'}`,
        priority: isApproved ? 'normal' : 'high',
        action: {
          type: 'view',
          url: isApproved ? '/borrower/loans/apply' : '/borrower/kyc',
          buttonText: isApproved ? 'Apply for Loan' : 'Review KYC'
        },
        metadata: {
          kycStatus: kycData.status,
          rejectionReason: kycData.rejectionReason,
          approvedAt: kycData.approvedAt
        }
      });

    } catch (error) {
      console.error('Error notifying KYC decision:', error);
    }
  }

  /**
   * Create notification for loan approval/rejection
   */
  static async notifyLoanDecision(loanData) {
    try {
      const isApproved = loanData.status === 'approved';
      
      // Notify borrower
      await this.createNotification({
        recipientId: loanData.borrowerId,
        type: isApproved ? 'loan_approval' : 'loan_rejection',
        title: isApproved ? 'Loan Application Approved!' : 'Loan Application Rejected',
        message: isApproved 
          ? `Great news! Your loan application for ₦${loanData.amount.toLocaleString()} has been approved and is now available for funding.`
          : `Your loan application for ₦${loanData.amount.toLocaleString()} has been rejected. Reason: ${loanData.rejectionReason || 'Please contact support for details.'}`,
        priority: isApproved ? 'high' : 'normal',
        action: {
          type: 'view',
          url: `/borrower/loans/${loanData.loanId}`,
          buttonText: 'View Details'
        },
        relatedEntities: {
          loan: loanData.loanId
        },
        metadata: {
          amount: loanData.amount,
          currency: 'USD',
          rejectionReason: loanData.rejectionReason,
          approvedAt: loanData.approvedAt
        }
      });

      // Notify lenders about new approved loan (if approved)
      if (isApproved) {
        const lenders = await User.find({ userType: 'lender' });
        const notifications = lenders.map(lender => ({
          recipientId: lender._id,
          type: 'investment_opportunity',
          title: 'New Investment Opportunity Available',
          message: `A new loan application for ₦${loanData.amount.toLocaleString()} has been approved and is available for investment.`,
          priority: 'normal',
          action: {
            type: 'view',
            url: `/lender/loan-applications/${loanData.loanId}`,
            buttonText: 'View Opportunity'
          },
          relatedEntities: {
            loan: loanData.loanId,
            user: loanData.borrowerId
          },
          metadata: {
            amount: loanData.amount,
            currency: 'USD',
            borrowerName: loanData.borrowerName,
            purpose: loanData.purpose
          }
        }));

        await this.createBulkNotifications(notifications);
      }

    } catch (error) {
      console.error('Error notifying loan decision:', error);
    }
  }

  /**
   * Create notification for payment due
   */
  static async notifyPaymentDue(paymentData) {
    try {
      await this.createNotification({
        recipientId: paymentData.borrowerId,
        type: 'repayment_due',
        title: 'Payment Due Reminder',
        message: `Your loan payment of ₦${paymentData.amount.toLocaleString()} is due on ${new Date(paymentData.dueDate).toLocaleDateString()}. Please make your payment to avoid late fees.`,
        priority: 'high',
        actionRequired: true,
        action: {
          type: 'pay',
          url: `/borrower/payments/${paymentData.loanId}`,
          buttonText: 'Make Payment',
          expiresAt: paymentData.dueDate
        },
        relatedEntities: {
          loan: paymentData.loanId
        },
        metadata: {
          amount: paymentData.amount,
          currency: 'USD',
          dueDate: paymentData.dueDate,
          installmentNumber: paymentData.installmentNumber,
          lateFee: paymentData.lateFee || 0
        }
      });

    } catch (error) {
      console.error('Error notifying payment due:', error);
    }
  }

  /**
   * Create notification for late payment
   */
  static async notifyLatePayment(paymentData) {
    try {
      await this.createNotification({
        recipientId: paymentData.borrowerId,
        type: 'payment_failed',
        title: 'Payment Overdue',
        message: `Your loan payment of ₦${paymentData.amount.toLocaleString()} is overdue. Late fee of ₦${paymentData.lateFee.toLocaleString()} has been applied. Please make payment immediately.`,
        priority: 'urgent',
        actionRequired: true,
        action: {
          type: 'pay',
          url: `/borrower/payments/${paymentData.loanId}`,
          buttonText: 'Pay Now'
        },
        relatedEntities: {
          loan: paymentData.loanId
        },
        metadata: {
          amount: paymentData.amount,
          currency: 'USD',
          dueDate: paymentData.dueDate,
          lateFee: paymentData.lateFee,
          daysOverdue: paymentData.daysOverdue
        }
      });

      // Notify lender about late payment
      await this.createNotification({
        recipientId: paymentData.lenderId,
        type: 'payment_failed',
        title: 'Borrower Payment Overdue',
        message: `Payment of ₦${paymentData.amount.toLocaleString()} from ${paymentData.borrowerName} is overdue. We're working to resolve this.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/lender/investments/${paymentData.loanId}`,
          buttonText: 'View Investment'
        },
        relatedEntities: {
          loan: paymentData.loanId,
          user: paymentData.borrowerId
        },
        metadata: {
          amount: paymentData.amount,
          currency: 'USD',
          borrowerName: paymentData.borrowerName,
          daysOverdue: paymentData.daysOverdue
        }
      });

    } catch (error) {
      console.error('Error notifying late payment:', error);
    }
  }

  /**
   * Create notification for security alert
   */
  static async notifySecurityAlert(alertData) {
    try {
      await this.createNotification({
        recipientId: alertData.userId,
        type: 'security_alert',
        title: 'Security Alert',
        message: alertData.message,
        priority: 'urgent',
        actionRequired: true,
        action: {
          type: 'contact',
          url: '/support',
          buttonText: 'Contact Support'
        },
        metadata: {
          alertType: alertData.alertType,
          ipAddress: alertData.ipAddress,
          userAgent: alertData.userAgent,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error notifying security alert:', error);
    }
  }

  /**
   * Create notification for referral completion
   */
  static async notifyReferralCompletion(referralData) {
    try {
      await this.createNotification({
        recipientId: referralData.referrerId,
        type: 'referral_completed',
        title: 'Referral Reward Earned!',
        message: `Congratulations! You've earned ₦${referralData.rewardAmount.toLocaleString()} for successfully referring ${referralData.referredUserName}.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: '/referrals',
          buttonText: 'View Referrals'
        },
        metadata: {
          rewardAmount: referralData.rewardAmount,
          currency: 'USD',
          referredUserName: referralData.referredUserName,
          referralId: referralData.referralId
        }
      });

    } catch (error) {
      console.error('Error notifying referral completion:', error);
    }
  }

  /**
   * Create notification for system maintenance
   */
  static async notifySystemMaintenance(maintenanceData) {
    try {
      const users = await User.find({});
      
      const notifications = users.map(user => ({
        recipientId: user._id,
        type: 'system_announcement',
        title: 'Scheduled System Maintenance',
        message: `System maintenance is scheduled for ${new Date(maintenanceData.scheduledTime).toLocaleString()}. Expected downtime: ${maintenanceData.duration}.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: '/maintenance',
          buttonText: 'Learn More'
        },
        metadata: {
          scheduledTime: maintenanceData.scheduledTime,
          duration: maintenanceData.duration,
          affectedServices: maintenanceData.affectedServices
        }
      }));

      await this.createBulkNotifications(notifications);

    } catch (error) {
      console.error('Error notifying system maintenance:', error);
    }
  }

  /**
   * Create notification for wallet transaction
   */
  static async notifyWalletTransaction(transactionData) {
    try {
      const isDeposit = transactionData.type === 'deposit';
      
      await this.createNotification({
        recipientId: transactionData.userId,
        type: 'payment_received',
        title: isDeposit ? 'Wallet Deposit Successful' : 'Wallet Withdrawal Processed',
        message: isDeposit 
          ? `Your wallet has been credited with ₦${transactionData.amount.toLocaleString()}. Transaction ID: ${transactionData.transactionId}`
          : `Your withdrawal of ₦${transactionData.amount.toLocaleString()} has been processed. Transaction ID: ${transactionData.transactionId}`,
        priority: 'normal',
        action: {
          type: 'view',
          url: '/wallet',
          buttonText: 'View Wallet'
        },
        metadata: {
          amount: transactionData.amount,
          currency: 'USD',
          transactionId: transactionData.transactionId,
          paymentMethod: transactionData.paymentMethod,
          transactionType: transactionData.type
        }
      });

    } catch (error) {
      console.error('Error notifying wallet transaction:', error);
    }
  }

  /**
   * Create notification for collateral approval/rejection
   */
  static async notifyCollateralDecision(collateralData) {
    try {
      const isApproved = collateralData.status === 'approved';
      
      await this.createNotification({
        recipientId: collateralData.borrowerId,
        type: isApproved ? 'kyc_approval' : 'kyc_rejection',
        title: isApproved ? 'Collateral Verification Approved' : 'Collateral Verification Rejected',
        message: isApproved 
          ? `Your collateral verification has been approved! Verified value: ₦${collateralData.verifiedValue.toLocaleString()}`
          : `Your collateral verification has been rejected. Reason: ${collateralData.rejectionReason}`,
        priority: isApproved ? 'normal' : 'high',
        action: {
          type: 'view',
          url: `/borrower/collateral-status`,
          buttonText: 'View Details'
        },
        metadata: {
          collateralType: collateralData.collateralType,
          estimatedValue: collateralData.estimatedValue,
          verifiedValue: collateralData.verifiedValue,
          rejectionReason: collateralData.rejectionReason
        }
      });

    } catch (error) {
      console.error('Error notifying collateral decision:', error);
    }
  }

  /**
   * Create notification for wallet deposit
   */
  static async notifyWalletDeposit(depositData) {
    try {
      await this.createNotification({
        recipientId: depositData.userId,
        type: 'payment_received',
        title: 'Wallet Deposit Successful',
        message: `Your wallet has been credited with ₦${depositData.amount.toLocaleString()}. Transaction ID: ${depositData.transactionId}`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/wallet`,
          buttonText: 'View Wallet'
        },
        metadata: {
          amount: depositData.amount,
          currency: 'USD',
          transactionId: depositData.transactionId,
          paymentMethod: depositData.paymentMethod
        }
      });

    } catch (error) {
      console.error('Error notifying wallet deposit:', error);
    }
  }

  /**
   * Create notification for loan repayment
   */
  static async notifyLoanRepayment(repaymentData) {
    try {
      // Notify borrower about successful repayment
      await this.createNotification({
        recipientId: repaymentData.borrowerId,
        type: 'repayment_received',
        title: 'Loan Repayment Successful',
        message: `Your loan repayment of ₦${repaymentData.amount.toLocaleString()} has been processed successfully.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/borrower/loans/${repaymentData.loanId}`,
          buttonText: 'View Loan Details'
        },
        relatedEntities: {
          loan: repaymentData.loanId
        },
        metadata: {
          amount: repaymentData.amount,
          currency: 'USD',
          installmentNumber: repaymentData.installmentNumber,
          lateFee: repaymentData.lateFee || 0
        }
      });

      // Notify lender about repayment received
      await this.createNotification({
        recipientId: repaymentData.lenderId,
        type: 'repayment_received',
        title: 'Repayment Received',
        message: `You have received a repayment of ₦${repaymentData.amount.toLocaleString()} from ${repaymentData.borrowerName}.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/lender/investments/${repaymentData.loanId}`,
          buttonText: 'View Investment'
        },
        relatedEntities: {
          loan: repaymentData.loanId,
          user: repaymentData.borrowerId
        },
        metadata: {
          amount: repaymentData.amount,
          currency: 'USD',
          borrowerName: repaymentData.borrowerName,
          installmentNumber: repaymentData.installmentNumber
        }
      });

    } catch (error) {
      console.error('Error notifying loan repayment:', error);
    }
  }

  /**
   * Create welcome notification for new users
   */
  static async notifyWelcome(userData) {
    try {
      await this.createNotification({
        recipientId: userData.userId,
        type: 'welcome_message',
        title: 'Welcome to FUNDLI!',
        message: `Welcome to FUNDLI, ${userData.userName}! Complete your profile setup to start borrowing or investing.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/profile`,
          buttonText: 'Complete Profile'
        },
        metadata: {
          userName: userData.userName,
          userType: userData.userType
        }
      });

    } catch (error) {
      console.error('Error creating welcome notification:', error);
    }
  }

  /**
   * Create system announcement notification
   */
  static async notifySystemAnnouncement(announcementData) {
    try {
      const users = await User.find({});
      
      const notifications = users.map(user => ({
        recipientId: user._id,
        type: 'system_announcement',
        title: announcementData.title,
        message: announcementData.message,
        priority: announcementData.priority || 'normal',
        action: announcementData.actionUrl ? {
          type: 'view',
          url: announcementData.actionUrl,
          buttonText: announcementData.actionButtonText || 'Learn More'
        } : { type: 'none' },
        metadata: {
          announcementId: announcementData.id,
          category: announcementData.category
        }
      }));

      await this.createBulkNotifications(notifications);

    } catch (error) {
      console.error('Error creating system announcement:', error);
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { recipient: userId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Notification.countDocuments({ recipient: userId });
      const unread = await Notification.countDocuments({ recipient: userId, status: 'unread' });

      return {
        total,
        unread,
        read: total - unread,
        byStatus: stats
      };

    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.updateMany(
        {
          expiresAt: { $lt: new Date() },
          status: 'unread'
        },
        {
          status: 'archived'
        }
      );

      console.log(`Archived ${result.modifiedCount} expired notifications`);
      return result.modifiedCount;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  /**
   * Notify borrower about loan approval
   */
  static async notifyLoanApproved({ borrowerId, borrowerName, loanId, loanAmount, purpose }) {
    try {
      await this.createNotification({
        recipientId: borrowerId,
        type: 'loan_approved',
        title: 'Loan Application Approved! 🎉',
        message: `Congratulations! Your loan application for ₦${loanAmount.toLocaleString()} (${purpose}) has been approved and is now available for funding.`,
        priority: 'high',
        actionRequired: false,
        metadata: {
          loanId,
          loanAmount,
          purpose,
          action: 'view_loan'
        }
      });
      console.log(`📧 Loan approval notification sent to borrower ${borrowerId}`);
    } catch (error) {
      console.error('Error sending loan approval notification:', error);
    }
  }

  /**
   * Notify lenders about new approved loan
   */
  static async notifyNewApprovedLoan({ lenderId, lenderName, loanId, borrowerName, loanAmount, purpose }) {
    try {
      await this.createNotification({
        recipientId: lenderId,
        type: 'new_approved_loan',
        title: 'New Loan Available for Funding! 💰',
        message: `A new loan application has been approved: ₦${loanAmount.toLocaleString()} for ${purpose} by ${borrowerName}. Check it out!`,
        priority: 'high',
        actionRequired: true,
        metadata: {
          loanId,
          loanAmount,
          purpose,
          borrowerName,
          action: 'view_loan'
        }
      });
      console.log(`📧 New approved loan notification sent to lender ${lenderId}`);
    } catch (error) {
      console.error('Error sending new approved loan notification:', error);
    }
  }

  /**
   * Notify borrower about loan rejection
   */
  static async notifyLoanRejected({ borrowerId, borrowerName, loanId, rejectionReason }) {
    try {
      await this.createNotification({
        recipientId: borrowerId,
        type: 'loan_rejected',
        title: 'Loan Application Update',
        message: `Your loan application has been reviewed. Unfortunately, it was not approved at this time. Reason: ${rejectionReason}`,
        priority: 'normal',
        actionRequired: false,
        metadata: {
          loanId,
          rejectionReason,
          action: 'view_loan'
        }
      });
      console.log(`📧 Loan rejection notification sent to borrower ${borrowerId}`);
    } catch (error) {
      console.error('Error sending loan rejection notification:', error);
    }
  }

  /**
   * Notify lender about loan rejection by admin
   */
  static async notifyLoanRejectedByAdmin({ lenderId, lenderName, loanId, borrowerName, loanAmount, rejectionReason }) {
    try {
      await this.createNotification({
        recipientId: lenderId,
        type: 'loan_rejected_by_admin',
        title: 'Loan Application Rejected',
        message: `A loan application from ${borrowerName} for ₦${loanAmount.toLocaleString()} has been rejected by admin. Reason: ${rejectionReason}`,
        priority: 'normal',
        actionRequired: false,
        metadata: {
          loanId,
          borrowerName,
          amount: loanAmount,
          rejectionReason,
          action: 'view_loan'
        }
      });
      console.log(`📧 Loan rejection notification sent to lender ${lenderId}`);
    } catch (error) {
      console.error('Error sending loan rejection notification to lender:', error);
    }
  }

  /**
   * Notify lenders about new loan application submitted
   */
  static async notifyNewLoanApplication({ lenderId, lenderName, loanId, borrowerName, loanAmount, purpose }) {
    try {
      await this.createNotification({
        recipientId: lenderId,
        type: 'loan_application',
        title: 'New Loan Application Submitted! 📝',
        message: `${borrowerName} has submitted a loan application for ₦${loanAmount.toLocaleString()} for ${purpose}. Review and consider funding!`,
        priority: 'high',
        actionRequired: true,
        action: {
          type: 'view',
          url: `/lender/loan-applications`,
          buttonText: 'Review Application'
        },
        metadata: {
          loanId,
          loanAmount,
          purpose,
          borrowerName,
          action: 'review_loan'
        }
      });
      console.log(`📧 New loan application notification sent to lender ${lenderId}`);
    } catch (error) {
      console.error('Error sending new loan application notification:', error);
    }
  }

  /**
   * Notify lender about loan repayment received
   */
  static async notifyRepaymentReceived({ lenderId, lenderName, loanId, borrowerName, repaymentAmount, loanAmount }) {
    try {
      await this.createNotification({
        recipientId: lenderId,
        type: 'repayment_received',
        title: 'Loan Repayment Received! 💰',
        message: `You received ₦${repaymentAmount.toLocaleString()} repayment from ${borrowerName} for loan ₦${loanAmount.toLocaleString()}.`,
        priority: 'normal',
        actionRequired: false,
        action: {
          type: 'view',
          url: `/lender/investments`,
          buttonText: 'View Investment'
        },
        metadata: {
          loanId,
          repaymentAmount,
          borrowerName,
          loanAmount,
          action: 'view_investment'
        }
      });
      console.log(`📧 Repayment received notification sent to lender ${lenderId}`);
    } catch (error) {
      console.error('Error sending repayment received notification:', error);
    }
  }

  /**
   * Notify lender about loan due for repayment
   */
  static async notifyRepaymentDue({ lenderId, lenderName, loanId, borrowerName, loanAmount, dueDate, daysUntilDue }) {
    try {
      const urgencyLevel = daysUntilDue <= 3 ? 'urgent' : daysUntilDue <= 7 ? 'high' : 'normal';
      const urgencyEmoji = daysUntilDue <= 3 ? '🚨' : daysUntilDue <= 7 ? '⚠️' : '📅';
      
      await this.createNotification({
        recipientId: lenderId,
        type: 'repayment_due',
        title: `Loan Repayment Due ${urgencyEmoji}`,
        message: `Loan of ₦${loanAmount.toLocaleString()} from ${borrowerName} is due for repayment ${daysUntilDue <= 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        priority: urgencyLevel,
        actionRequired: true,
        action: {
          type: 'view',
          url: `/lender/investments`,
          buttonText: 'View Investment',
          expiresAt: new Date(dueDate)
        },
        metadata: {
          loanId,
          loanAmount,
          borrowerName,
          dueDate,
          daysUntilDue,
          action: 'view_investment'
        }
      });
      console.log(`📧 Repayment due notification sent to lender ${lenderId}`);
    } catch (error) {
      console.error('Error sending repayment due notification:', error);
    }
  }

  /**
   * Notify lender about loan fully repaid
   */
  static async notifyLoanFullyRepaid({ lenderId, lenderName, loanId, borrowerName, totalRepayment, loanAmount }) {
    try {
      await this.createNotification({
        recipientId: lenderId,
        type: 'repayment_received',
        title: 'Loan Fully Repaid! 🎉',
        message: `Congratulations! ${borrowerName} has fully repaid their loan of ₦${loanAmount.toLocaleString()}. Total received: ₦${totalRepayment.toLocaleString()}`,
        priority: 'normal',
        actionRequired: false,
        action: {
          type: 'view',
          url: `/lender/investments`,
          buttonText: 'View Investment'
        },
        metadata: {
          loanId,
          totalRepayment,
          borrowerName,
          loanAmount,
          action: 'view_investment'
        }
      });
      console.log(`📧 Loan fully repaid notification sent to lender ${lenderId}`);
    } catch (error) {
      console.error('Error sending loan fully repaid notification:', error);
    }
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  /**
   * Notify admin about new user registration
   */
  static async notifyAdminNewUserRegistration({ userId, userType, userName, userEmail }) {
    try {
      // Get all admins
      const admins = await User.find({ userType: 'admin' });
      
      for (const admin of admins) {
        await this.createNotification({
          recipientId: admin._id,
          type: 'new_user_registration',
          title: 'New User Registration! 👤',
          message: `A new ${userType} has registered: ${userName} (${userEmail})`,
          priority: 'normal',
          actionRequired: false,
          action: {
            type: 'view',
            url: `/admin/users`,
            buttonText: 'View Users'
          },
          metadata: {
            userId,
            userType,
            userName,
            userEmail,
            action: 'view_users'
          }
        });
      }
      
      console.log(`📧 New user registration notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending new user registration notifications:', error);
    }
  }

  /**
   * Notify admin about new loan pool creation
   */
  static async notifyAdminNewLoanPool({ poolId, poolName, lenderName, lenderEmail, poolSize, interestRate }) {
    try {
      // Get all admins
      const admins = await User.find({ userType: 'admin' });
      
      for (const admin of admins) {
        await this.createNotification({
          recipientId: admin._id,
          type: 'new_loan_pool',
          title: 'New Loan Pool Created! 🏦',
          message: `${lenderName} created a new loan pool "${poolName}" with ₦${poolSize.toLocaleString()} at ${interestRate}% interest`,
          priority: 'normal',
          actionRequired: false,
          action: {
            type: 'view',
            url: `/admin/pools`,
            buttonText: 'View Pools'
          },
          metadata: {
            poolId,
            poolName,
            lenderName,
            lenderEmail,
            poolSize,
            interestRate,
            action: 'view_pools'
          }
        });
      }
      
      console.log(`📧 New loan pool notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending new loan pool notifications:', error);
    }
  }

  /**
   * Notify admin about new loan application
   */
  static async notifyAdminNewLoanApplication({ loanId, borrowerName, borrowerEmail, loanAmount, purpose }) {
    try {
      // Get all admins
      const admins = await User.find({ userType: 'admin' });
      
      for (const admin of admins) {
        await this.createNotification({
          recipientId: admin._id,
          type: 'new_loan_application',
          title: 'New Loan Application! 📝',
          message: `${borrowerName} applied for a loan of ₦${loanAmount.toLocaleString()} for ${purpose}`,
          priority: 'high',
          actionRequired: true,
          action: {
            type: 'view',
            url: `/admin/loan-applications`,
            buttonText: 'Review Application'
          },
          metadata: {
            loanId,
            borrowerName,
            borrowerEmail,
            loanAmount,
            purpose,
            action: 'review_application'
          }
        });
      }
      
      console.log(`📧 New loan application notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending new loan application notifications:', error);
    }
  }

  /**
   * Notify admin about loan funding
   */
  static async notifyAdminLoanFunded({ loanId, borrowerName, lenderName, fundedAmount, loanAmount }) {
    try {
      // Get all admins
      const admins = await User.find({ userType: 'admin' });
      
      for (const admin of admins) {
        await this.createNotification({
          recipientId: admin._id,
          type: 'loan_funded',
          title: 'Loan Funded! 💰',
          message: `${lenderName} funded ${borrowerName}'s loan of ₦${loanAmount.toLocaleString()} with ₦${fundedAmount.toLocaleString()}`,
          priority: 'normal',
          actionRequired: false,
          action: {
            type: 'view',
            url: `/admin/loans`,
            buttonText: 'View Loans'
          },
          metadata: {
            loanId,
            borrowerName,
            lenderName,
            fundedAmount,
            loanAmount,
            action: 'view_loans'
          }
        });
      }
      
      console.log(`📧 Loan funded notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending loan funded notifications:', error);
    }
  }

  /**
   * Notify admin about loan repayment
   */
  static async notifyAdminLoanRepayment({ loanId, borrowerName, lenderName, repaymentAmount, loanAmount }) {
    try {
      // Get all admins
      const admins = await User.find({ userType: 'admin' });
      
      for (const admin of admins) {
        await this.createNotification({
          recipientId: admin._id,
          type: 'loan_repayment',
          title: 'Loan Repayment Made! 💳',
          message: `${borrowerName} made a repayment of ₦${repaymentAmount.toLocaleString()} to ${lenderName} for loan ₦${loanAmount.toLocaleString()}`,
          priority: 'normal',
          actionRequired: false,
          action: {
            type: 'view',
            url: `/admin/loans`,
            buttonText: 'View Loans'
          },
          metadata: {
            loanId,
            borrowerName,
            lenderName,
            repaymentAmount,
            loanAmount,
            action: 'view_loans'
          }
        });
      }
      
      console.log(`📧 Loan repayment notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending loan repayment notifications:', error);
    }
  }

  /**
   * Notify admin about loan due for repayment
   */
  static async notifyAdminLoanDueForRepayment({ loanId, borrowerName, lenderName, loanAmount, dueDate, daysUntilDue }) {
    try {
      // Get all admins
      const admins = await User.find({ userType: 'admin' });
      
      const urgencyLevel = daysUntilDue <= 3 ? 'urgent' : daysUntilDue <= 7 ? 'high' : 'normal';
      const urgencyEmoji = daysUntilDue <= 3 ? '🚨' : daysUntilDue <= 7 ? '⚠️' : '📅';
      
      for (const admin of admins) {
        await this.createNotification({
          recipientId: admin._id,
          type: 'loan_due_for_repayment',
          title: `Loan Due for Repayment ${urgencyEmoji}`,
          message: `Loan of ₦${loanAmount.toLocaleString()} from ${borrowerName} to ${lenderName} is due ${daysUntilDue <= 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
          priority: urgencyLevel,
          actionRequired: true,
          action: {
            type: 'view',
            url: `/admin/loans`,
            buttonText: 'View Loans',
            expiresAt: new Date(dueDate)
          },
          metadata: {
            loanId,
            borrowerName,
            lenderName,
            loanAmount,
            dueDate,
            daysUntilDue,
            action: 'view_loans'
          }
        });
      }
      
      console.log(`📧 Loan due for repayment notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending loan due for repayment notifications:', error);
    }
  }

  /**
   * Notify borrower about credit score update
   */
  static async notifyCreditScoreUpdate({ borrowerId, newPoints, totalPoints, creditScore }) {
    try {
      await this.createNotification({
        recipientId: borrowerId,
        type: 'credit_score_update',
        title: 'Great job! Points earned 🎯',
        message: `You earned ${newPoints} reliability point${newPoints === 1 ? '' : 's'}. Total points: ${totalPoints}.`,
        priority: 'normal',
        actionRequired: false,
        action: { type: 'view', url: '/borrower/loans', buttonText: 'View Loans' },
        metadata: { totalPoints, creditScore }
      });
    } catch (error) {
      console.error('Error sending credit score update notification:', error);
    }
  }

  /**
   * Notify borrower about new badge earned
   */
  static async notifyBadgeEarned({ borrowerId, badgeKey, badgeName, icon }) {
    try {
      await this.createNotification({
        recipientId: borrowerId,
        type: 'badge_earned',
        title: 'Badge Unlocked! 🏅',
        message: `You earned the “${badgeName}” badge. Keep it up!`,
        priority: 'high',
        actionRequired: false,
        action: { type: 'view', url: '/profile', buttonText: 'View Badges' },
        metadata: { badgeKey, badgeName, icon }
      });
    } catch (error) {
      console.error('Error sending badge earned notification:', error);
    }
  }
}

module.exports = NotificationService;
