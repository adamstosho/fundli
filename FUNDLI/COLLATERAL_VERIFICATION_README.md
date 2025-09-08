# Collateral Verification Feature

This document describes the implementation of the Collateral Verification feature in the Fundli interpersonal lending platform.

## Overview

The Collateral Verification feature allows borrowers to upload collateral documents (e.g., vehicle registration papers, property deeds) which are automatically sent to Onfido for verification. The system displays verification results to lenders and ensures only verified collateral is considered for loan approval.

## Features

### Frontend (React + TailwindCSS)

- **CollateralUpload Component**: Dedicated component for handling collateral document uploads
- **File Input**: Accepts .jpg, .png, .pdf files with preview
- **Multiple Collateral Types**: Real estate, vehicles, business assets, investments
- **Value Estimation**: Users can specify estimated collateral value
- **Verification Status**: Displays pending, verified, rejected status
- **Document Management**: Upload, preview, and remove documents

### Backend (Node.js + Express + MongoDB)

- **API Endpoints**: Complete REST API for collateral management
- **File Upload**: Multer middleware for handling document uploads
- **Onfido Integration**: Service for document verification
- **MongoDB Storage**: Persistent storage of collateral and verification data
- **Admin Management**: Admin-only routes for verification management

## API Endpoints

### Public Routes
- `POST /api/collateral/webhook` - Onfido webhook for verification results

### User Routes (Authentication Required)
- `GET /api/collateral/user/:userId` - Get user's collateral
- `GET /api/collateral/verified/:userId` - Get verified collateral for lenders
- `POST /api/collateral/verify` - Submit collateral for verification
- `DELETE /api/collateral/:collateralId` - Delete collateral

### Admin Routes (Admin Authentication Required)
- `GET /api/collateral/admin/pending` - Get pending verifications
- `GET /api/collateral/admin/stats` - Get collateral statistics
- `PUT /api/collateral/admin/:collateralId/status` - Update verification status

## Database Schema

### Collateral Model
```javascript
{
  userId: ObjectId,           // Reference to User
  collateralType: String,     // real_estate, vehicle, business, investment, other
  description: String,        // Collateral description
  estimatedValue: Number,     // Estimated value in USD
  documents: [{
    fileName: String,         // Cloudinary file ID
    originalName: String,     // Original filename
    fileUrl: String,          // Cloudinary URL
    fileSize: Number,         // File size in bytes
    mimeType: String,         // File MIME type
    uploadDate: Date          // Upload timestamp
  }],
  verificationStatus: String, // pending, submitted, verified, rejected
  verificationId: String,     // Onfido verification ID
  onfidoResult: {
    status: String,           // clear, suspected, rejected, needs_review
    reportId: String,         // Onfido report ID
    completedAt: Date,        // Verification completion time
    notes: String             // Additional notes
  },
  submittedAt: Date,          // Submission timestamp
  verifiedAt: Date,           // Verification timestamp
  rejectedAt: Date,           // Rejection timestamp
  rejectionReason: String,    // Reason for rejection
  adminNotes: String,         // Admin notes
  isActive: Boolean           // Active status
}
```

## File Upload Configuration

- **Supported Formats**: JPG, PNG, PDF, DOC, DOCX
- **File Size Limit**: 10MB per file
- **Maximum Files**: 5 files per collateral item
- **Storage**: Cloudinary cloud storage
- **Security**: File type validation and size restrictions

## Onfido Integration

### Features
- **Applicant Creation**: Automatic applicant creation in Onfido
- **Document Upload**: Secure document upload to Onfido
- **Verification Checks**: Automated document verification
- **Webhook Processing**: Real-time status updates
- **Fallback Mode**: Simulated verification for development

### Environment Variables
```bash
ONFIDO_API_TOKEN=your_onfido_api_token
ONFIDO_BASE_URL=https://api.onfido.com/v3
ONFIDO_WEBHOOK_TOKEN=your_webhook_secret
```

## Usage

### For Borrowers
1. Navigate to loan application page
2. Add collateral information (type, description, value)
3. Upload supporting documents
4. Submit for verification
5. Monitor verification status

### For Lenders
1. View borrower's verified collateral
2. Assess collateral value and type
3. Make informed lending decisions

### For Admins
1. Access `/admin/collateral` route
2. Review pending verifications
3. Approve or reject collateral
4. Monitor verification statistics

## Security Features

- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control (admin/user)
- **File Validation**: Strict file type and size validation
- **Webhook Verification**: Secure webhook signature validation
- **Rate Limiting**: API rate limiting for abuse prevention

## Error Handling

- **File Upload Errors**: Graceful handling of upload failures
- **Onfido API Errors**: Fallback to simulated verification
- **Database Errors**: Proper error responses and logging
- **Validation Errors**: Client-friendly error messages

## Development Notes

### Simulated Mode
When `ONFIDO_API_TOKEN` is not configured, the system runs in simulated mode:
- Creates mock verification IDs
- Simulates processing delays
- Provides development-friendly responses

### Testing
- Test file uploads with various file types
- Verify admin access controls
- Test webhook processing
- Validate error handling scenarios

## Future Enhancements

- **OCR Processing**: Extract text from uploaded documents
- **AI Verification**: Machine learning-based document analysis
- **Multi-language Support**: International document types
- **Advanced Analytics**: Detailed verification metrics
- **Mobile App**: Native mobile collateral upload

## Dependencies

### Frontend
- React 18+
- TailwindCSS
- Framer Motion
- Lucide React Icons

### Backend
- Node.js 16+
- Express.js
- MongoDB with Mongoose
- Multer (file uploads)
- Cloudinary SDK
- Axios (HTTP client)

## Installation

1. Install backend dependencies:
```bash
cd FUNDLI-Backend
npm install
```

2. Install frontend dependencies:
```bash
cd FUNDLI
npm install
```

3. Configure environment variables
4. Start backend server
5. Start frontend development server

## Support

For technical support or questions about the collateral verification feature, please refer to the development team or create an issue in the project repository.
