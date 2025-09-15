const Feedback = require('../models/Feedback');
const Loan = require('../models/Loan');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// @desc    Send feedback to borrower or lender
// @route   POST /api/feedback/send
// @access  Private (Admin only)
const sendFeedback = async (req, res) => {
  try {
    console.log('=== Feedback API Called ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    // Handle both old and new API formats
    const { 
      loanId, 
      recipientId, 
      recipient, 
      type, 
      subject, 
      message, 
      priority, 
      replyDeadline, 
      deadline,
      loan 
    } = req.body;

    // Use new format fields if available, fallback to old format
    const actualRecipientId = recipient || recipientId;
    const actualLoanId = loan || loanId;
    const actualDeadline = deadline || replyDeadline;

    console.log('Processed fields:', {
      actualRecipientId,
      actualLoanId,
      subject,
      message,
      priority
    });

    // Validate required fields
    if (!actualRecipientId || !subject || !message) {
      console.log('Validation failed - missing required fields:', {
        actualRecipientId: !!actualRecipientId,
        subject: !!subject,
        message: !!message
      });
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: recipient, subject, and message are required'
      });
    }

    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can send feedback'
      });
    }

    // Check if loan exists (only if loanId is provided and not a placeholder)
    let loanDoc = null;
    if (actualLoanId && actualLoanId !== 'general-feedback' && actualLoanId !== 'undefined' && actualLoanId !== 'null') {
      try {
        loanDoc = await Loan.findById(actualLoanId);
        if (!loanDoc) {
          console.log(`Loan with ID ${actualLoanId} not found, treating as general feedback`);
          // Don't fail, just treat as general feedback without loan reference
        }
      } catch (error) {
        console.log(`Error finding loan ${actualLoanId}:`, error.message);
        // Don't fail, just treat as general feedback without loan reference
      }
    }

    // Check if recipient exists
    let recipientUser = null;
    if (actualRecipientId && actualRecipientId !== 'undefined' && actualRecipientId !== 'null') {
      try {
        recipientUser = await User.findById(actualRecipientId);
        if (!recipientUser) {
          console.log(`Recipient with ID ${actualRecipientId} not found`);
          return res.status(404).json({
            status: 'error',
            message: 'Recipient not found. Please select a valid user.'
          });
        }
      } catch (error) {
        console.log(`Error finding recipient ${actualRecipientId}:`, error.message);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid recipient ID format'
        });
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient is required'
      });
    }

    // Note: We don't validate recipient type in the new API format
    // The frontend handles recipient selection based on context

    // Create feedback
    const feedback = new Feedback({
      loan: loanDoc ? actualLoanId : null, // Only include loan if we found a valid loan
      sender: req.user.id,
      recipient: actualRecipientId,
      subject,
      message,
      priority: priority || 'medium',
      deadline: actualDeadline ? new Date(actualDeadline) : null
    });

    await feedback.save();

    // Populate sender and recipient details
    await feedback.populate('sender', 'firstName lastName email userType');
    await feedback.populate('recipient', 'firstName lastName email userType');

    // Send notification to recipient
    try {
      await NotificationService.notifyFeedbackReceived({
        recipientId: actualRecipientId,
        recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        subject,
        loanId: loanDoc ? actualLoanId : null, // Only include loanId if we have a valid loan
        feedbackId: feedback._id
      });
    } catch (notificationError) {
      console.error('Failed to send feedback notification:', notificationError);
      // Don't fail the entire operation if notification fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Feedback sent successfully',
      data: {
        feedback: {
          id: feedback._id,
          subject: feedback.subject,
          message: feedback.message,
          type: feedback.type,
          priority: feedback.priority,
          status: feedback.status,
          sender: {
            name: `${feedback.sender.firstName} ${feedback.sender.lastName}`,
            email: feedback.sender.email,
            userType: feedback.sender.userType
          },
          recipient: {
            name: `${feedback.recipient.firstName} ${feedback.recipient.lastName}`,
            email: feedback.recipient.email,
            userType: feedback.recipient.userType
          },
          createdAt: feedback.createdAt,
          replyDeadline: feedback.replyDeadline
        }
      }
    });

  } catch (error) {
    console.error('Send feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send feedback',
      error: error.message
    });
  }
};

// @desc    Get all feedback for a specific loan
// @route   GET /api/feedback/loan/:loanId
// @access  Private (Admin, Borrower, Lender)
// @desc    Get all feedback (admin only)
// @route   GET /api/feedback
// @access  Private (Admin only)
const getAllFeedback = async (req, res) => {
  try {
    console.log('=== Get All Feedback API Called ===');
    console.log('User:', req.user);
    console.log('User Type:', req.user?.userType);
    console.log('User ID:', req.user?.id);

    // Check if user is admin
    if (req.user?.userType !== 'admin') {
      console.log('Access denied - user is not admin');
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can view all feedback'
      });
    }

    // Get all feedback with populated sender and recipient details
    const feedback = await Feedback.find()
      .populate('sender', 'firstName lastName email userType')
      .populate('recipient', 'firstName lastName email userType')
      .populate('loan', 'title amount status')
      .sort({ createdAt: -1 });

    console.log(`Found ${feedback.length} feedback records`);

    res.status(200).json({
      status: 'success',
      message: 'Feedback retrieved successfully',
      data: {
        feedback,
        count: feedback.length
      }
    });

  } catch (error) {
    console.error('Error getting all feedback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve feedback',
      error: error.message
    });
  }
};

const getFeedbackForLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Check if user has permission to view this loan's feedback
    const canView = req.user.userType === 'admin' || 
                   loan.borrower.toString() === req.user.id.toString();

    if (!canView) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view feedback for this loan'
      });
    }

    const feedback = await Feedback.getFeedbackForLoan(loanId);

    res.status(200).json({
      status: 'success',
      data: {
        feedback: feedback.map(fb => ({
          id: fb._id,
          subject: fb.subject,
          message: fb.message,
          type: fb.type,
          priority: fb.priority,
          status: fb.status,
          isReply: fb.isReply,
          parentFeedback: fb.parentFeedback,
          sender: {
            name: `${fb.sender.firstName} ${fb.sender.lastName}`,
            email: fb.sender.email,
            userType: fb.sender.userType
          },
          recipient: {
            name: `${fb.recipient.firstName} ${fb.recipient.lastName}`,
            email: fb.recipient.email,
            userType: fb.recipient.userType
          },
          createdAt: fb.createdAt,
          readAt: fb.readAt,
          replyDeadline: fb.replyDeadline,
          attachments: fb.attachments
        }))
      }
    });

  } catch (error) {
    console.error('Get feedback for loan error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get feedback for loan',
      error: error.message
    });
  }
};

// @desc    Get my feedback (sent and received)
// @route   GET /api/feedback/my-feedback
// @access  Private (All users)
// @desc    Get feedback for a specific user by ID
// @route   GET /api/feedback/user/:userId
// @access  Private (All users)
const getFeedbackForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, status, page = 1, limit = 20 } = req.query;

    console.log('=== Get Feedback for User API Called ===');
    console.log('Requested userId:', userId);
    console.log('Authenticated user:', req.user.id);

    // Build query
    let query = {
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find(query)
      .populate('sender', 'firstName lastName email userType')
      .populate('recipient', 'firstName lastName email userType')
      .populate('loan', 'loanAmount purpose status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    console.log(`Found ${feedback.length} feedback records for user ${userId}`);

    res.status(200).json({
      status: 'success',
      data: {
        feedback: feedback.map(fb => ({
          id: fb._id,
          subject: fb.subject,
          message: fb.message,
          type: fb.type,
          priority: fb.priority,
          status: fb.status,
          isReply: fb.isReply,
          parentFeedback: fb.parentFeedback,
          sender: {
            name: `${fb.sender.firstName} ${fb.sender.lastName}`,
            email: fb.sender.email,
            userType: fb.sender.userType
          },
          recipient: {
            name: `${fb.recipient.firstName} ${fb.recipient.lastName}`,
            email: fb.recipient.email,
            userType: fb.recipient.userType
          },
          loan: fb.loan ? {
            id: fb.loan._id,
            amount: fb.loan.loanAmount,
            purpose: fb.loan.purpose,
            status: fb.loan.status
          } : null,
          createdAt: fb.createdAt,
          updatedAt: fb.updatedAt,
          readAt: fb.readAt,
          deadline: fb.deadline
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error getting feedback for user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve feedback',
      error: error.message
    });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Build query
    let query = {
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedback = await Feedback.find(query)
      .populate('sender', 'firstName lastName email userType')
      .populate('recipient', 'firstName lastName email userType')
      .populate('loanId', 'loanAmount purpose status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        feedback: feedback.map(fb => ({
          id: fb._id,
          subject: fb.subject,
          message: fb.message,
          type: fb.type,
          priority: fb.priority,
          status: fb.status,
          isReply: fb.isReply,
          parentFeedback: fb.parentFeedback,
          sender: {
            name: `${fb.sender.firstName} ${fb.sender.lastName}`,
            email: fb.sender.email,
            userType: fb.sender.userType
          },
          recipient: {
            name: `${fb.recipient.firstName} ${fb.recipient.lastName}`,
            email: fb.recipient.email,
            userType: fb.recipient.userType
          },
          loan: {
            id: fb.loanId._id,
            amount: fb.loanId.loanAmount,
            purpose: fb.loanId.purpose,
            status: fb.loanId.status
          },
          createdAt: fb.createdAt,
          readAt: fb.readAt,
          replyDeadline: fb.replyDeadline,
          attachments: fb.attachments
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get feedback',
      error: error.message
    });
  }
};

// @desc    Mark feedback as read
// @route   PUT /api/feedback/:feedbackId/read
// @access  Private (Recipient only)
const markFeedbackAsRead = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        status: 'error',
        message: 'Feedback not found'
      });
    }

    // Check if user is the recipient
    if (feedback.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only mark your own feedback as read'
      });
    }

    await feedback.markAsRead();

    res.status(200).json({
      status: 'success',
      message: 'Feedback marked as read',
      data: {
        feedbackId: feedback._id,
        status: feedback.status,
        readAt: feedback.readAt
      }
    });

  } catch (error) {
    console.error('Mark feedback as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark feedback as read',
      error: error.message
    });
  }
};

// @desc    Reply to feedback
// @route   POST /api/feedback/:feedbackId/reply
// @access  Private (Recipient only)
const replyToFeedback = async (req, res) => {
  try {
    console.log('=== Reply to Feedback API Called ===');
    console.log('Feedback ID:', req.params.feedbackId);
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    const { feedbackId } = req.params;
    const { message, subject } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required for reply'
      });
    }

    const originalFeedback = await Feedback.findById(feedbackId);
    if (!originalFeedback) {
      return res.status(404).json({
        status: 'error',
        message: 'Original feedback not found'
      });
    }

    // Check if user is the recipient of the original feedback
    if (originalFeedback.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only reply to feedback sent to you'
      });
    }

    // Determine reply type based on original feedback type
    let replyType;
    if (originalFeedback.type === 'admin_to_borrower') {
      replyType = 'borrower_to_admin';
    } else if (originalFeedback.type === 'admin_to_lender') {
      replyType = 'lender_to_admin';
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot reply to this type of feedback'
      });
    }

    // Create reply
    const reply = new Feedback({
      loan: originalFeedback.loan, // Fixed: use 'loan' instead of 'loanId'
      sender: req.user.id,
      recipient: originalFeedback.sender,
      type: replyType,
      subject: subject || `Re: ${originalFeedback.subject}`,
      message,
      priority: originalFeedback.priority,
      isReply: true,
      parentFeedback: originalFeedback._id
    });

    await reply.save();
    console.log('Reply saved successfully:', reply._id);

    // Mark original feedback as replied
    await originalFeedback.markAsReplied();
    console.log('Original feedback marked as replied');

    // Populate sender and recipient details
    await reply.populate('sender', 'firstName lastName email userType');
    await reply.populate('recipient', 'firstName lastName email userType');
    console.log('Reply populated with sender and recipient details');

    // Send notification to original sender (admin)
    try {
      await NotificationService.notifyFeedbackReply({
        recipientId: originalFeedback.sender,
        recipientName: `${originalFeedback.sender.firstName} ${originalFeedback.sender.lastName}`,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        subject: reply.subject,
        loanId: originalFeedback.loanId,
        feedbackId: reply._id
      });
    } catch (notificationError) {
      console.error('Failed to send reply notification:', notificationError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Reply sent successfully',
      data: {
        reply: {
          id: reply._id,
          subject: reply.subject,
          message: reply.message,
          type: reply.type,
          priority: reply.priority,
          status: reply.status,
          isReply: reply.isReply,
          parentFeedback: reply.parentFeedback,
          sender: {
            name: `${reply.sender.firstName} ${reply.sender.lastName}`,
            email: reply.sender.email,
            userType: reply.sender.userType
          },
          recipient: {
            name: `${reply.recipient.firstName} ${reply.recipient.lastName}`,
            email: reply.recipient.email,
            userType: reply.recipient.userType
          },
          createdAt: reply.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Reply to feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

// @desc    Get feedback statistics
// @route   GET /api/feedback/stats
// @access  Private (Admin only)
const getFeedbackStats = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can view feedback statistics'
      });
    }

    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        statusStats: stats,
        typeStats: typeStats,
        priorityStats: priorityStats,
        totalFeedback: await Feedback.countDocuments()
      }
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get feedback statistics',
      error: error.message
    });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:feedbackId
// @access  Private (Sender or Admin)
const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        status: 'error',
        message: 'Feedback not found'
      });
    }

    // Check if user is the sender or admin
    const canDelete = feedback.sender.toString() === req.user.id.toString() || 
                     req.user.userType === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own feedback or be an admin'
      });
    }

    await Feedback.findByIdAndDelete(feedbackId);

    res.status(200).json({
      status: 'success',
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};

module.exports = {
  sendFeedback,
  getAllFeedback,
  getFeedbackForLoan,
  getFeedbackForUser,
  getMyFeedback,
  markFeedbackAsRead,
  replyToFeedback,
  getFeedbackStats,
  deleteFeedback
};
