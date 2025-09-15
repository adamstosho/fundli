const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fundli_jwt_secret_key_2024_secure_random_string';
}

const app = express();
const PORT = 5001; // Use different port to avoid conflicts

// Middleware
app.use(express.json());

// Simple feedback route for testing
app.post('/api/feedback', (req, res) => {
  console.log('Feedback API called with:', req.body);
  res.json({
    status: 'success',
    message: 'Feedback API is working!',
    data: {
      feedback: {
        id: 'test-feedback-id',
        subject: req.body.subject,
        message: req.body.message,
        recipient: req.body.recipient
      }
    }
  });
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
  const testData = {
    recipient: 'test-user-id',
    subject: 'Test Feedback',
    message: 'This is a test feedback message',
    priority: 'medium'
  };
  
  console.log('\nTesting feedback API...');
  fetch(`http://localhost:${PORT}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('API Response:', data);
  })
  .catch(error => {
    console.error('API Error:', error);
  });
}, 2000);

