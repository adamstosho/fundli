const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Mock user for testing
const mockUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2a', // password: "Test123456"
  firstName: 'Test',
  lastName: 'User',
  userType: 'borrower',
  isEmailVerified: true,
  kycStatus: 'pending',
  isActive: true
};

// Mock login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (email !== mockUser.email) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, mockUser.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: mockUser.id, userType: mockUser.userType },
      'your_jwt_secret_key_here_change_this_in_production',
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: mockUser.id,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          userType: mockUser.userType,
          kycStatus: mockUser.kycStatus,
          isEmailVerified: mockUser.isEmailVerified
        },
        accessToken: token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock server running' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`📧 Test login with: test@example.com / Test123456`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
