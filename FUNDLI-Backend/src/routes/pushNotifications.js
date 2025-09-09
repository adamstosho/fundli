const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotificationService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/notifications/subscribe
 * @desc    Subscribe user to push notifications
 * @access  Private
 */
router.post('/subscribe', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        status: 'error',
        message: 'Push subscription is required'
      });
    }

    const result = await pushNotificationService.subscribeUser(userId, subscription);

    logger.info('User subscribed to push notifications', {
      userId,
      subscriptionId: subscription.endpoint
    });

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to subscribe user to push notifications', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/unsubscribe
 * @desc    Unsubscribe user from push notifications
 * @access  Private
 */
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    const result = await pushNotificationService.unsubscribeUser(userId, subscription);

    logger.info('User unsubscribed from push notifications', {
      userId,
      subscriptionId: subscription?.endpoint
    });

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to unsubscribe user from push notifications', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/notifications/history
 * @desc    Get user notification history
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await pushNotificationService.getNotificationHistory(userId, limit);

    res.status(200).json({
      status: 'success',
      message: 'Notification history retrieved successfully',
      data: {
        notifications,
        totalNotifications: notifications.length
      }
    });
  } catch (error) {
    logger.error('Failed to get notification history', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId/read', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pushNotificationService.markAsRead(notificationId, userId);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', {
      error: error.message,
      notificationId: req.params.notificationId,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/send
 * @desc    Send push notification to user
 * @access  Private (Admin only)
 */
router.post('/send', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { userId, title, body, type, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, title, and body are required'
      });
    }

    const result = await pushNotificationService.sendToUser(userId, {
      title,
      body,
      type,
      data
    });

    logger.info('Admin sent push notification', {
      adminId: req.user.id,
      targetUserId: userId,
      title
    });

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to send push notification', {
      error: error.message,
      adminId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/send-bulk
 * @desc    Send push notification to multiple users
 * @access  Private (Admin only)
 */
router.post('/send-bulk', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { userIds, title, body, type, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        status: 'error',
        message: 'userIds (array), title, and body are required'
      });
    }

    const result = await pushNotificationService.sendToUsers(userIds, {
      title,
      body,
      type,
      data
    });

    logger.info('Admin sent bulk push notifications', {
      adminId: req.user.id,
      targetUserCount: userIds.length,
      successful: result.results.length,
      failed: result.errors.length
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        successful: result.results.length,
        failed: result.errors.length,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error('Failed to send bulk push notifications', {
      error: error.message,
      adminId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/send-by-type
 * @desc    Send push notification to users by type
 * @access  Private (Admin only)
 */
router.post('/send-by-type', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { userType, title, body, type, data } = req.body;

    if (!userType || !title || !body) {
      return res.status(400).json({
        status: 'error',
        message: 'userType, title, and body are required'
      });
    }

    const result = await pushNotificationService.sendToUserType(userType, {
      title,
      body,
      type,
      data
    });

    logger.info('Admin sent push notifications by user type', {
      adminId: req.user.id,
      userType,
      successful: result.results.length,
      failed: result.errors.length
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        userType,
        successful: result.results.length,
        failed: result.errors.length,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error('Failed to send push notifications by user type', {
      error: error.message,
      adminId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private (Admin only)
 */
router.get('/stats', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const stats = await pushNotificationService.getNotificationStats();

    res.status(200).json({
      status: 'success',
      message: 'Notification statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get notification stats', {
      error: error.message,
      adminId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/loan/:loanId
 * @desc    Send loan-related notification
 * @access  Private (Admin only)
 */
router.post('/loan/:loanId', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { loanId } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        status: 'error',
        message: 'Notification type is required'
      });
    }

    const Loan = require('../models/Loan');
    const loan = await Loan.findById(loanId).populate('borrowerId');

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    const result = await pushNotificationService.sendLoanNotification(
      loan.borrowerId._id,
      type,
      loan
    );

    logger.info('Loan notification sent', {
      adminId: req.user.id,
      loanId,
      borrowerId: loan.borrowerId._id,
      type
    });

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to send loan notification', {
      error: error.message,
      loanId: req.params.loanId,
      adminId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
