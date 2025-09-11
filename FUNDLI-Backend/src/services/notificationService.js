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
        message: `A new loan application has been submitted by ${loanData.borrowerName} for $${loanData.amount.toLocaleString()}`,
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
        message: `Your loan application for $${loanData.amount.toLocaleString()} has been submitted and is under review.`,
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
        message: `Congratulations! Your loan application for $${loanData.amount.toLocaleString()} has been fully funded and is ready for disbursement.`,
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
        message: `Your investment of $${loanData.investmentAmount.toLocaleString()} has been successfully processed for ${loanData.borrowerName}'s loan.`,
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
   * Create notification for collateral verification
   */
  static async notifyCollateralVerification(collateralData) {
    try {
      // Notify admin about new collateral verification
      const adminUsers = await User.find({ userType: 'admin' });
      
      const notifications = adminUsers.map(admin => ({
        recipientId: admin._id,
        type: 'account_verification',
        title: 'New Collateral Verification Submitted',
        message: `${collateralData.borrowerName} has submitted collateral verification for $${collateralData.estimatedValue.toLocaleString()}`,
        priority: 'high',
        actionRequired: true,
        action: {
          type: 'view',
          url: `/admin/collateral-review`,
          buttonText: 'Review Collateral'
        },
        relatedEntities: {
          user: collateralData.borrowerId
        },
        metadata: {
          collateralType: collateralData.collateralType,
          estimatedValue: collateralData.estimatedValue,
          borrowerName: collateralData.borrowerName
        }
      }));

      await this.createBulkNotifications(notifications);
      
      // Notify borrower about successful submission
      await this.createNotification({
        recipientId: collateralData.borrowerId,
        type: 'account_verification',
        title: 'Collateral Verification Submitted',
        message: `Your collateral verification has been submitted and is under review by our team.`,
        priority: 'normal',
        action: {
          type: 'view',
          url: `/borrower/collateral-status`,
          buttonText: 'Check Status'
        },
        metadata: {
          collateralType: collateralData.collateralType,
          estimatedValue: collateralData.estimatedValue
        }
      });

    } catch (error) {
      console.error('Error notifying collateral verification:', error);
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
          ? `Your collateral verification has been approved! Verified value: $${collateralData.verifiedValue.toLocaleString()}`
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
        message: `Your wallet has been credited with $${depositData.amount.toLocaleString()}. Transaction ID: ${depositData.transactionId}`,
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
        message: `Your loan repayment of $${repaymentData.amount.toLocaleString()} has been processed successfully.`,
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
        message: `You have received a repayment of $${repaymentData.amount.toLocaleString()} from ${repaymentData.borrowerName}.`,
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
            _id: '$status',
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
}

module.exports = NotificationService;
