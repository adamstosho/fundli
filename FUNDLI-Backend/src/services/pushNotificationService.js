const webpush = require('web-push');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    // Configure VAPID keys only if they exist
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:admin@fundli.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } else {
      console.warn('VAPID keys not configured. Push notifications will be disabled.');
    }
  }

  /**
   * Subscribe user to push notifications
   * @param {string} userId - User ID
   * @param {Object} subscription - Push subscription object
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeUser(userId, subscription) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Store subscription in user document
      user.pushSubscription = subscription;
      user.pushNotificationsEnabled = true;
      await user.save();

      logger.info('User subscribed to push notifications', {
        userId,
        subscriptionId: subscription.endpoint
      });

      return {
        success: true,
        message: 'Successfully subscribed to push notifications'
      };
    } catch (error) {
      logger.error('Failed to subscribe user to push notifications', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   * @param {string} userId - User ID
   * @param {Object} subscription - Push subscription object
   * @returns {Promise<Object>} Unsubscription result
   */
  async unsubscribeUser(userId, subscription) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove subscription from user document
      user.pushSubscription = undefined;
      user.pushNotificationsEnabled = false;
      await user.save();

      logger.info('User unsubscribed from push notifications', {
        userId,
        subscriptionId: subscription.endpoint
      });

      return {
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      };
    } catch (error) {
      logger.error('Failed to unsubscribe user from push notifications', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Send push notification to a single user
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendToUser(userId, notificationData) {
    try {
      // Check if VAPID keys are configured
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys not configured. Skipping push notification.');
        return {
          success: false,
          message: 'Push notifications not configured'
        };
      }

      const user = await User.findById(userId);
      if (!user || !user.pushSubscription || !user.pushNotificationsEnabled) {
        throw new Error('User not found or not subscribed to push notifications');
      }

      const payload = JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon || '/icon-192x192.png',
        badge: notificationData.badge || '/badge-72x72.png',
        data: notificationData.data || {},
        actions: notificationData.actions || [
          {
            action: 'explore',
            title: 'View Details'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      });

      await webpush.sendNotification(user.pushSubscription, payload);

      // Save notification to database
      await this.saveNotification(userId, notificationData);

      logger.info('Push notification sent to user', {
        userId,
        title: notificationData.title,
        type: notificationData.type
      });

      return {
        success: true,
        message: 'Push notification sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send push notification to user', {
        error: error.message,
        userId,
        title: notificationData.title
      });
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendToUsers(userIds, notificationData) {
    try {
      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notificationData);
          results.push({ userId, success: true });
        } catch (error) {
          errors.push({ userId, error: error.message });
        }
      }

      logger.info('Bulk push notification sent', {
        totalUsers: userIds.length,
        successful: results.length,
        failed: errors.length
      });

      return {
        success: true,
        message: `Push notifications sent to ${results.length} users`,
        results,
        errors
      };
    } catch (error) {
      logger.error('Failed to send bulk push notifications', {
        error: error.message,
        userIds
      });
      throw error;
    }
  }

  /**
   * Send push notification to all users of a specific type
   * @param {string} userType - User type (borrower, lender, admin)
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendToUserType(userType, notificationData) {
    try {
      const users = await User.find({
        userType,
        pushNotificationsEnabled: true,
        pushSubscription: { $exists: true }
      });

      const userIds = users.map(user => user._id.toString());
      
      if (userIds.length === 0) {
        return {
          success: true,
          message: 'No users found with push notifications enabled',
          results: [],
          errors: []
        };
      }

      return await this.sendToUsers(userIds, notificationData);
    } catch (error) {
      logger.error('Failed to send push notifications to user type', {
        error: error.message,
        userType
      });
      throw error;
    }
  }

  /**
   * Send loan-related notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} loanData - Loan data
   * @returns {Promise<Object>} Send result
   */
  async sendLoanNotification(userId, type, loanData) {
    const notificationTemplates = {
      'loan_approved': {
        title: 'Loan Approved! 🎉',
        body: `Your loan application for ₦${loanData.amount?.toLocaleString()} has been approved.`,
        data: { type: 'loan_approved', loanId: loanData._id }
      },
      'loan_rejected': {
        title: 'Loan Application Update',
        body: `Your loan application for ₦${loanData.amount?.toLocaleString()} was not approved.`,
        data: { type: 'loan_rejected', loanId: loanData._id }
      },
      'payment_due': {
        title: 'Payment Due Reminder',
        body: `Your payment of ₦${loanData.amount?.toLocaleString()} is due soon.`,
        data: { type: 'payment_due', loanId: loanData._id }
      },
      'payment_received': {
        title: 'Payment Received ✅',
        body: `Payment of ₦${loanData.amount?.toLocaleString()} has been received.`,
        data: { type: 'payment_received', loanId: loanData._id }
      },
      'loan_disbursed': {
        title: 'Loan Disbursed 💰',
        body: `Your loan of ₦${loanData.amount?.toLocaleString()} has been disbursed to your account.`,
        data: { type: 'loan_disbursed', loanId: loanData._id }
      }
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return await this.sendToUser(userId, {
      ...template,
      type,
      icon: '/icon-192x192.png'
    });
  }

  /**
   * Send KYC notification
   * @param {string} userId - User ID
   * @param {string} status - KYC status
   * @returns {Promise<Object>} Send result
   */
  async sendKYCNotification(userId, status) {
    const notificationTemplates = {
      'verified': {
        title: 'KYC Verified ✅',
        body: 'Your identity verification has been completed successfully.',
        data: { type: 'kyc_verified' }
      },
      'rejected': {
        title: 'KYC Update Required',
        body: 'Your identity verification needs attention. Please check your documents.',
        data: { type: 'kyc_rejected' }
      },
      'pending': {
        title: 'KYC Under Review',
        body: 'Your identity verification is being reviewed. We\'ll notify you soon.',
        data: { type: 'kyc_pending' }
      }
    };

    const template = notificationTemplates[status];
    if (!template) {
      throw new Error(`Unknown KYC status: ${status}`);
    }

    return await this.sendToUser(userId, {
      ...template,
      type: 'kyc_update',
      icon: '/icon-192x192.png'
    });
  }

  /**
   * Send marketplace notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} Send result
   */
  async sendMarketplaceNotification(userId, type, data) {
    const notificationTemplates = {
      'new_match': {
        title: 'New Match Found! 🎯',
        body: `We found ${data.matchCount} potential matches for your loan application.`,
        data: { type: 'new_match', ...data }
      },
      'investment_opportunity': {
        title: 'New Investment Opportunity',
        body: `A new loan opportunity for ₦${data.amount?.toLocaleString()} is available.`,
        data: { type: 'investment_opportunity', ...data }
      }
    };

    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Unknown marketplace notification type: ${type}`);
    }

    return await this.sendToUser(userId, {
      ...template,
      type,
      icon: '/icon-192x192.png'
    });
  }

  /**
   * Save notification to database
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Saved notification
   */
  async saveNotification(userId, notificationData) {
    try {
      const notification = new Notification({
        userId,
        title: notificationData.title,
        body: notificationData.body,
        type: notificationData.type || 'general',
        data: notificationData.data || {},
        sentAt: new Date(),
        status: 'sent'
      });

      await notification.save();
      return notification;
    } catch (error) {
      logger.error('Failed to save notification', {
        error: error.message,
        userId,
        title: notificationData.title
      });
      throw error;
    }
  }

  /**
   * Get user notification history
   * @param {string} userId - User ID
   * @param {number} limit - Number of notifications to return
   * @returns {Promise<Array>} Notification history
   */
  async getNotificationHistory(userId, limit = 20) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      logger.error('Failed to get notification history', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { readAt: new Date(), status: 'read' },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        error: error.message,
        notificationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats() {
    try {
      const totalNotifications = await Notification.countDocuments();
      const sentNotifications = await Notification.countDocuments({ status: 'sent' });
      const readNotifications = await Notification.countDocuments({ status: 'read' });
      const subscribedUsers = await User.countDocuments({ 
        pushNotificationsEnabled: true,
        pushSubscription: { $exists: true }
      });

      return {
        totalNotifications,
        sentNotifications,
        readNotifications,
        subscribedUsers,
        readRate: totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get notification stats', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
