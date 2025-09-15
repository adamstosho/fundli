const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fundli_jwt_secret_key_2024_secure_random_string';
}

const app = express();
const PORT = 5003; // Use different port

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
    console.log('=== Feedback API Called ===');
    console.log('Request body:', req.body);
    
    const { 
      recipient, 
      subject, 
      message, 
      priority, 
      deadline,
      loan 
    } = req.body;

    console.log('Processed fields:', {
      recipient,
      subject,
      message,
      priority,
      loan
    });

    // Validate required fields
    if (!recipient || !subject || !message) {
      console.log('Validation failed - missing required fields:', {
        recipient: !!recipient,
        subject: !!subject,
        message: !!message
      });
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

    // Create feedback (mock) - this simulates what the real model would do
    const feedback = {
      _id: 'feedback-' + Date.now(),
      loan: loan || null,
      sender: mockAdmin._id,
      recipient: recipient,
      subject,
      message,
      priority: priority || 'medium',
      deadline: deadline ? new Date(deadline) : null,
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

// Test the feedback API
setTimeout(() => {
  console.log('\n=== Testing Feedback API with New Format ===\n');
  
  // Test with the exact format the frontend sends
  const testData = {
    recipient: 'test-user-id',
    subject: 'Test Feedback Subject',
    message: 'This is a test feedback message',
    priority: 'medium'
  };
  
  console.log('Testing with data:', testData);
  
  fetch(`http://localhost:${PORT}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Response:', data);
    if (data.status === 'success') {
      console.log('🎉 Feedback API is working correctly!');
    } else {
      console.log('❌ API returned error:', data.message);
    }
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });
}, 2000);

