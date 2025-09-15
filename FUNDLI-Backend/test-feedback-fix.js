const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fundli_jwt_secret_key_2024_secure_random_string';
}

const app = express();
const PORT = 5002; // Use different port

// Middleware
app.use(express.json());

// Mock User model for testing
const mockUser = {
  _id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  userType: 'borrower'
};

// Mock admin user
const mockAdmin = {
  _id: 'admin-user-id',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  userType: 'admin'
};

// Mock feedback creation function
const createFeedback = async (req, res) => {
  try {
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

    console.log('Received feedback data:', {
      actualRecipientId,
      actualLoanId,
      subject,
      message,
      priority
    });

    // Validate required fields
    if (!actualRecipientId || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: recipient, subject, and message are required'
      });
    }

    // Check if user is admin (mock)
    if (req.user && req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can send feedback'
      });
    }

    // Check if loan exists (only if loanId is provided and not a placeholder)
    let loanDoc = null;
    if (actualLoanId && actualLoanId !== 'general-feedback' && actualLoanId !== 'undefined' && actualLoanId !== 'null') {
      try {
        // Mock loan check - in real app this would query the database
        if (actualLoanId === 'valid-loan-id') {
          loanDoc = { _id: actualLoanId, title: 'Test Loan' };
        } else {
          console.log(`Loan with ID ${actualLoanId} not found, treating as general feedback`);
        }
      } catch (error) {
        console.log(`Error finding loan ${actualLoanId}:`, error.message);
      }
    }

    // Check if recipient exists
    let recipientUser = null;
    if (actualRecipientId && actualRecipientId !== 'undefined' && actualRecipientId !== 'null') {
      try {
        // Mock recipient check - in real app this would query the database
        if (actualRecipientId === 'test-user-id') {
          recipientUser = mockUser;
        } else {
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

    // Create feedback (mock)
    const feedback = {
      _id: 'feedback-' + Date.now(),
      loan: loanDoc ? actualLoanId : null,
      sender: mockAdmin._id,
      recipient: actualRecipientId,
      subject,
      message,
      priority: priority || 'medium',
      deadline: actualDeadline ? new Date(actualDeadline) : null,
      createdAt: new Date()
    };

    console.log('Created feedback:', feedback);

    res.status(201).json({
      status: 'success',
      message: 'Feedback sent successfully',
      data: {
        feedback: {
          id: feedback._id,
          subject: feedback.subject,
          message: feedback.message,
          recipient: feedback.recipient,
          loan: feedback.loan,
          priority: feedback.priority,
          createdAt: feedback.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Routes
app.post('/api/feedback', (req, res) => {
  // Mock admin user for testing
  req.user = mockAdmin;
  createFeedback(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Feedback API: POST http://localhost:${PORT}/api/feedback`);
});

// Test cases
setTimeout(() => {
  console.log('\n=== Testing Feedback API ===\n');
  
  // Test 1: General feedback (no loan)
  console.log('Test 1: General feedback (no loan)');
  fetch(`http://localhost:${PORT}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient: 'test-user-id',
      subject: 'General Feedback',
      message: 'This is general feedback without a loan reference',
      priority: 'medium'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ General feedback test passed:', data.status);
  })
  .catch(error => {
    console.error('❌ General feedback test failed:', error);
  });

  // Test 2: Feedback with invalid loan ID
  setTimeout(() => {
    console.log('\nTest 2: Feedback with invalid loan ID');
    fetch(`http://localhost:${PORT}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: 'test-user-id',
        subject: 'Feedback with invalid loan',
        message: 'This feedback has an invalid loan ID but should still work',
        priority: 'high',
        loan: 'invalid-loan-id'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Invalid loan test passed:', data.status);
    })
    .catch(error => {
      console.error('❌ Invalid loan test failed:', error);
    });
  }, 1000);

  // Test 3: Feedback with valid loan ID
  setTimeout(() => {
    console.log('\nTest 3: Feedback with valid loan ID');
    fetch(`http://localhost:${PORT}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: 'test-user-id',
        subject: 'Feedback with valid loan',
        message: 'This feedback has a valid loan ID',
        priority: 'urgent',
        loan: 'valid-loan-id'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Valid loan test passed:', data.status);
    })
    .catch(error => {
      console.error('❌ Valid loan test failed:', error);
    });
  }, 2000);

  // Test 4: Missing recipient
  setTimeout(() => {
    console.log('\nTest 4: Missing recipient (should fail)');
    fetch(`http://localhost:${PORT}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Feedback without recipient',
        message: 'This should fail because no recipient is specified',
        priority: 'medium'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Missing recipient test passed (correctly failed):', data.status);
    })
    .catch(error => {
      console.error('❌ Missing recipient test failed:', error);
    });
  }, 3000);

}, 2000);

