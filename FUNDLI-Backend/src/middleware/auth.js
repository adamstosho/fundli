const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    console.log('Protect middleware called');
    console.log('Headers:', req.headers);
    
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token ? 'Token exists' : 'No token');
    }

    if (!token) {
      console.log('No token found in headers');
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully, user ID:', decoded.id);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      console.log('User found:', user.email, 'User type:', user.userType);

      if (!user.isActive) {
        console.log('User account is deactivated');
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      req.user = user;
      console.log('User attached to request, proceeding to next middleware');
      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    console.log('Protect middleware error:', error.message);
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.userType} is not authorized to access this route`
      });
    }

    next();
  };
};

const requireKYC = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    // Admin users don't need KYC verification
    if (req.user.userType === 'admin') {
      return next();
    }

    if (req.user.kycStatus !== 'approved') {
      return res.status(403).json({
        status: 'error',
        message: 'KYC verification required to access this feature'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorize,
  requireKYC,
  optionalAuth
}; 