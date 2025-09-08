const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    // Build filter
    const filter = { user: req.user.id };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get notifications
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications',
      error: error.message
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: {
        notification
      }
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        updatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { 
      emailNotifications, 
      pushNotifications, 
      smsNotifications,
      notificationTypes 
    } = req.body;

    // Update user notification preferences
    const updateData = {};
    if (emailNotifications !== undefined) updateData['notificationPreferences.email'] = emailNotifications;
    if (pushNotifications !== undefined) updateData['notificationPreferences.push'] = pushNotifications;
    if (smsNotifications !== undefined) updateData['notificationPreferences.sms'] = smsNotifications;
    if (notificationTypes) updateData['notificationPreferences.types'] = notificationTypes;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.notificationPreferences
      }
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');

    res.status(200).json({
      status: 'success',
      data: {
        preferences: user.notificationPreferences || {
          email: true,
          push: true,
          sms: false,
          types: ['loan_updates', 'payment_reminders', 'kyc_status', 'investment_updates']
        }
      }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notification preferences',
      error: error.message
    });
  }
});

// @desc    Create notification (for internal use)
// @route   POST /api/notifications/create
// @access  Private (Admin only)
router.post('/create', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can create notifications'
      });
    }

    const { userId, title, message, type, priority = 'medium', actionUrl } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, title, message, and type are required'
      });
    }

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      actionUrl,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      message: 'Notification created successfully',
      data: {
        notification
      }
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get notification counts
    const totalNotifications = await Notification.countDocuments({ user: userId });
    const unreadNotifications = await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });
    const readNotifications = totalNotifications - unreadNotifications;

    // Get notifications by type
    const notificationsByType = await Notification.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent notifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentNotifications = await Notification.countDocuments({
      user: userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      status: 'success',
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: readNotifications,
        recent: recentNotifications,
        byType: notificationsByType
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
});

module.exports = router;