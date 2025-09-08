const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const cloudinaryService = require('../services/cloudinaryService');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/users/kyc
// @desc    Submit KYC documents
// @access  Private
router.post('/kyc', [
  protect,
  body('idType')
    .isIn(['passport', 'national_id', 'drivers_license', 'voters_card'])
    .withMessage('Invalid ID type'),
  body('idNumber')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('ID number must be between 3 and 50 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date of birth'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  body('postalCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  validate
], async (req, res) => {
  try {
    console.log('KYC endpoint reached!');
    console.log('Request body:', req.body);
    console.log('User ID from token:', req.user.id);

    const {
      idType,
      idNumber,
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
      idFront,
      idBack,
      selfie,
      proofOfAddress
    } = req.body;

    console.log('Extracted data:', {
      idType,
      idNumber,
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
      hasIdFront: !!idFront,
      hasSelfie: !!selfie,
      hasIdBack: !!idBack,
      hasProofOfAddress: !!proofOfAddress
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('User found in database:', user.email);
    console.log('Current KYC status:', user.kycStatus);

    // Upload documents to Cloudinary
    const uploadedDocuments = {};
    
    // Test Cloudinary connection first
    try {
      console.log('Testing Cloudinary connection...');
      const connectionTest = await cloudinaryService.testConnection();
      console.log('Cloudinary connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        throw new Error(`Cloudinary connection failed: ${connectionTest.message}`);
      }
    } catch (connectionError) {
      console.error('Cloudinary connection test failed:', connectionError);
      return res.status(500).json({
        status: 'error',
        message: 'Cloudinary service unavailable',
        error: connectionError.message
      });
    }
    
    try {
      // Upload ID Front
      if (idFront) {
        console.log('Uploading ID Front to Cloudinary...');
        console.log('ID Front data type:', typeof idFront);
        console.log('ID Front data length:', idFront ? idFront.length : 'undefined');
        
        let idFrontResult;
        try {
          idFrontResult = await cloudinaryService.uploadKYCDocument(idFront, 'idFront');
        } catch (kycError) {
          console.log('KYC upload failed, trying profile picture method:', kycError.message);
          idFrontResult = await cloudinaryService.uploadProfilePicture(idFront);
        }
        
        uploadedDocuments.idFront = {
          url: idFrontResult.secure_url,
          publicId: idFrontResult.public_id,
          uploadedAt: new Date()
        };
        console.log('ID Front uploaded successfully:', idFrontResult.secure_url);
      }
      
      // Upload Selfie
      if (selfie) {
        console.log('Uploading Selfie to Cloudinary...');
        console.log('Selfie data type:', typeof selfie);
        console.log('Selfie data length:', selfie ? selfie.length : 'undefined');
        
        let selfieResult;
        try {
          selfieResult = await cloudinaryService.uploadKYCDocument(selfie, 'selfie');
        } catch (kycError) {
          console.log('KYC upload failed, trying profile picture method:', kycError.message);
          selfieResult = await cloudinaryService.uploadProfilePicture(selfie);
        }
        
        uploadedDocuments.selfie = {
          url: selfieResult.secure_url,
          publicId: selfieResult.public_id,
          uploadedAt: new Date()
        };
        console.log('Selfie uploaded successfully:', selfieResult.secure_url);
      }
      
      // Upload ID Back
      if (idBack) {
        console.log('Uploading ID Back to Cloudinary...');
        console.log('ID Back data type:', typeof idBack);
        console.log('ID Back data length:', idBack ? idBack.length : 'undefined');
        
        let idBackResult;
        try {
          idBackResult = await cloudinaryService.uploadKYCDocument(idBack, 'idBack');
        } catch (kycError) {
          console.log('KYC upload failed, trying profile picture method:', kycError.message);
          idBackResult = await cloudinaryService.uploadProfilePicture(idBack);
        }
        
        uploadedDocuments.idBack = {
          url: idBackResult.secure_url,
          publicId: idBackResult.public_id,
          uploadedAt: new Date()
        };
        console.log('ID Back uploaded successfully:', idBackResult.secure_url);
      }
      
      // Upload Proof of Address
      if (proofOfAddress) {
        console.log('Uploading Proof of Address to Cloudinary...');
        console.log('Proof data type:', typeof proofOfAddress);
        console.log('Proof data length:', proofOfAddress ? proofOfAddress.length : 'undefined');
        
        let proofResult;
        try {
          proofResult = await cloudinaryService.uploadKYCDocument(proofOfAddress, 'proofOfAddress');
        } catch (kycError) {
          console.log('KYC upload failed, trying profile picture method:', kycError.message);
          proofResult = await cloudinaryService.uploadProfilePicture(proofOfAddress);
        }
        
        uploadedDocuments.proofOfAddress = {
          url: proofResult.secure_url,
          publicId: proofResult.public_id,
          uploadedAt: new Date()
        };
        console.log('Proof of Address uploaded successfully:', proofResult.secure_url);
      }
    } catch (uploadError) {
      console.error('Error uploading documents to Cloudinary:', uploadError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to upload documents to Cloudinary',
        error: uploadError.message
      });
    }

    // Update KYC information
    user.kycDocuments = {
      idType,
      idNumber,
      dateOfBirth: new Date(dateOfBirth),
      address: {
        street: address,
        city,
        country,
        postalCode
      },
      documents: uploadedDocuments,
      submittedAt: new Date()
    };

    // Mark email as verified since they're going through KYC
    user.isEmailVerified = true;
    
    // Update KYC status to pending (will be reviewed by admin)
    user.kycStatus = 'pending';

    console.log('Before save - KYC Status:', user.kycStatus);
    console.log('Before save - User object:', JSON.stringify(user, null, 2));

    await user.save();

    console.log('After save - KYC Status:', user.kycStatus);
    console.log('After save - User object:', JSON.stringify(user, null, 2));

    // Verify the update by fetching the user again
    const updatedUser = await User.findById(req.user.id);
    console.log('After fetch - KYC Status:', updatedUser.kycStatus);
    console.log('After fetch - User object:', JSON.stringify(updatedUser, null, 2));

    res.status(200).json({
      status: 'success',
      message: 'KYC submitted successfully. Your account is being reviewed.',
      data: {
        kycStatus: updatedUser.kycStatus,
        submittedAt: updatedUser.kycDocuments.submittedAt
      }
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'KYC submission failed',
      error: error.message
    });
  }
});

// @route   GET /api/users/kyc/status
// @desc    Get KYC status
// @access  Private
router.get('/kyc/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('kycStatus kycDocuments');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        kycStatus: user.kycStatus,
        kycDocuments: user.kycDocuments
      }
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          kycStatus: user.kycStatus,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profilePicture: user.profilePicture,
          bio: user.bio,
          creditScore: user.creditScore,
          walletBalance: user.walletBalance,
          referralCode: user.referralCode,
          referralEarnings: user.referralEarnings,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  protect,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number (e.g., +1234567890 or 1234567890)'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  validate
], async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    console.log('User ID from token:', req.user.id);
    
    const { firstName, lastName, phone, bio } = req.body;
    
    // Find user and update profile
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('Current user data:', {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: user.bio
    });

    console.log('Update data:', { firstName, lastName, phone, bio });

    // Update allowed fields (only if they are provided and different)
    let hasChanges = false;
    
    if (firstName !== undefined && firstName !== user.firstName) {
      user.firstName = firstName;
      hasChanges = true;
      console.log('Updated firstName to:', firstName);
    }
    
    if (lastName !== undefined && lastName !== user.lastName) {
      user.lastName = lastName;
      hasChanges = true;
      console.log('Updated lastName to:', lastName);
    }
    
    if (phone !== undefined && phone !== user.phone) {
      user.phone = phone;
      hasChanges = true;
      console.log('Updated phone to:', phone);
    }
    
    if (bio !== undefined && bio !== user.bio) {
      user.bio = bio;
      hasChanges = true;
      console.log('Updated bio to:', bio);
    }

    if (!hasChanges) {
      return res.status(200).json({
        status: 'success',
        message: 'No changes to save',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            kycStatus: user.kycStatus,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            profilePicture: user.profilePicture,
            bio: user.bio,
            creditScore: user.creditScore,
            walletBalance: user.walletBalance,
            referralCode: user.referralCode,
            referralEarnings: user.referralEarnings,
            preferences: user.preferences,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          }
        }
      });
    }

    console.log('Saving user with changes...');
    await user.save();
    console.log('User saved successfully');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          kycStatus: user.kycStatus,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profilePicture: user.profilePicture,
          bio: user.bio,
          creditScore: user.creditScore,
          walletBalance: user.walletBalance,
          referralCode: user.referralCode,
          referralEarnings: user.referralEarnings,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      console.log('Validation error details:', error);
      console.log('Validation error name:', error.name);
      console.log('Validation error message:', error.message);
      
      const validationErrors = Object.values(error.errors).map(err => {
        console.log('Individual validation error:', err);
        return err.message;
      });
      
      console.log('Processed validation errors:', validationErrors);
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user profile',
      error: error.message
    });
  }
});

// @route   POST /api/users/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile-picture', protect, async (req, res) => {
  try {
    console.log('Profile picture upload request received');
    
    // Check if base64 image data was provided
    if (!req.body.profilePicture) {
      return res.status(400).json({
        status: 'error',
        message: 'No image data provided'
      });
    }

    // Validate base64 data
    const base64Data = req.body.profilePicture;
    if (!base64Data.startsWith('data:image/')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid image format. Please provide a valid base64 image.'
      });
    }

    // Extract image type and validate
    const imageType = base64Data.split(';')[0].split(':')[1];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      });
    }

    // Check file size (base64 is about 33% larger than original)
    const base64Size = Buffer.byteLength(base64Data, 'utf8');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (base64Size > maxSize) {
      return res.status(400).json({
        status: 'error',
        message: 'File size too large. Please upload an image smaller than 5MB.'
      });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const uploadResult = await cloudinaryService.uploadProfilePicture(base64Data);
    console.log('Cloudinary upload result:', uploadResult);

    // Delete old profile picture if it exists
    if (user.profilePicture && user.profilePicture.publicId) {
      try {
        await cloudinaryService.deleteFile(user.profilePicture.publicId);
        console.log('Old profile picture deleted from Cloudinary');
      } catch (deleteError) {
        console.warn('Failed to delete old profile picture:', deleteError);
        // Continue with the update even if deletion fails
      }
    }

    // Update user profile picture
    user.profilePicture = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };

    await user.save();
    console.log('Profile picture updated in database');

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: {
          url: user.profilePicture.url,
          publicId: user.profilePicture.publicId
        }
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
});

// @route   GET /api/users/wallet
// @desc    Get user wallet balance
// @access  Private
router.get('/wallet', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        balance: user.walletBalance || 0,
        currency: 'NGN'
      }
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
});

// @route   POST /api/users/wallet/fund
// @desc    Fund user wallet
// @access  Private
router.post('/wallet/fund', [
  protect,
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Amount must be at least ₦100'),
  body('paymentMethod')
    .isIn(['bank_transfer', 'card_payment', 'mobile_money'])
    .withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const PaystackService = require('../services/paystackService');
    const init = await PaystackService.initializePayment({
      type: 'wallet_funding',
      amount,
      currency: 'NGN',
      paymentMethod,
      description: 'Wallet funding',
      relatedEntities: {}
    }, user);

    return res.status(200).json({
      status: 'success',
      message: 'Payment initialized',
      data: init
    });

  } catch (error) {
    console.error('Fund wallet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fund wallet',
      error: error.message
    });
  }
});

// @route   POST /api/users/wallet/withdraw
// @desc    Withdraw from user wallet
// @access  Private
router.post('/wallet/withdraw', [
  protect,
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Amount must be at least ₦100'),
  body('bankDetails')
    .isObject()
    .withMessage('Bank details are required')
], async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user has sufficient balance
    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient wallet balance'
      });
    }

    // Update wallet balance
    user.walletBalance = (user.walletBalance || 0) - amount;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal processed successfully',
      data: {
        newBalance: user.walletBalance,
        amountWithdrawn: amount,
        bankDetails
      }
    });

  } catch (error) {
    console.error('Withdraw from wallet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
});

module.exports = router; 