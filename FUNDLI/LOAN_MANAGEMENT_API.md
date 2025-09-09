# Loan Application Management API Endpoints

## Overview
This document outlines the API endpoints that need to be implemented on the backend to support the loan application management system with accept/reject functionality and notifications.

## Lender Endpoints

### 1. Get Loan Applications for Lenders
```
GET /api/lender/loan-applications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loanApplications": [
      {
        "id": "loan_123",
        "borrower": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "loanAmount": 10000,
        "duration": 12,
        "purpose": "business_expansion",
        "status": "pending",
        "kycStatus": "verified",
        "collateral": {
          "description": "Property worth $50,000"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "fundingProgress": {
          "fundedAmount": 0,
          "targetAmount": 10000
        }
      }
    ]
  }
}
```

### 2. Accept Loan Application
```
POST /api/lender/loan/{loanId}/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "investmentAmount": 5000,
  "notes": "Interested in supporting this business expansion"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application accepted successfully",
  "data": {
    "loanId": "loan_123",
    "investmentAmount": 5000,
    "status": "approved"
  }
}
```

**Backend Actions:**
- Update loan status to "approved"
- Create investment record
- Send notification to borrower
- Update funding progress

### 3. Reject Loan Application
```
POST /api/lender/loan/{loanId}/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Insufficient collateral or high risk profile"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application rejected successfully",
  "data": {
    "loanId": "loan_123",
    "status": "rejected",
    "reason": "Insufficient collateral or high risk profile"
  }
}
```

**Backend Actions:**
- Update loan status to "rejected"
- Remove loan from lender's pending list
- Send notification to borrower with rejection reason
- Log rejection for analytics

## Notification Endpoints

### 4. Get User Notifications
```
GET /api/notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_789",
        "type": "loan_rejected",
        "title": "Loan Application Rejected",
        "message": "Your loan application for $10,000 has been rejected by lender John Smith.",
        "isRead": false,
        "createdAt": "2024-01-15T14:30:00Z",
        "metadata": {
          "loanId": "loan_123",
          "lenderName": "John Smith",
          "reason": "Insufficient collateral or high risk profile",
          "amount": 10000
        }
      },
      {
        "id": "notif_790",
        "type": "loan_approved",
        "title": "Loan Application Approved",
        "message": "Congratulations! Your loan application for $10,000 has been approved.",
        "isRead": true,
        "createdAt": "2024-01-15T12:00:00Z",
        "metadata": {
          "loanId": "loan_124",
          "amount": 10000,
          "duration": 12,
          "monthlyPayment": 833.33
        }
      }
    ]
  }
}
```

### 5. Mark Notification as Read
```
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 6. Delete Notification
```
DELETE /api/notifications/{notificationId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Database Schema Updates

### Notifications Table
```sql
CREATE TABLE notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type ENUM('loan_approved', 'loan_rejected', 'loan_pending', 'payment_due', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Loan Applications Table Updates
```sql
ALTER TABLE loan_applications 
ADD COLUMN rejection_reason TEXT,
ADD COLUMN rejected_by VARCHAR(255),
ADD COLUMN rejected_at TIMESTAMP NULL,
ADD COLUMN accepted_by VARCHAR(255),
ADD COLUMN accepted_at TIMESTAMP NULL;
```

## Notification Types

### 1. Loan Rejected Notification
- **Type:** `loan_rejected`
- **Trigger:** When lender rejects a loan application
- **Recipient:** Borrower
- **Metadata:** 
  - `loanId`: ID of the rejected loan
  - `lenderName`: Name of the lender who rejected
  - `reason`: Rejection reason provided by lender
  - `amount`: Loan amount that was rejected

### 2. Loan Approved Notification
- **Type:** `loan_approved`
- **Trigger:** When lender accepts a loan application
- **Recipient:** Borrower
- **Metadata:**
  - `loanId`: ID of the approved loan
  - `amount`: Approved loan amount
  - `duration`: Loan duration in months
  - `monthlyPayment`: Calculated monthly payment

### 3. Loan Pending Notification
- **Type:** `loan_pending`
- **Trigger:** When loan application is submitted
- **Recipient:** Borrower
- **Metadata:**
  - `loanId`: ID of the pending loan
  - `amount`: Loan amount
  - `purpose`: Loan purpose

## Implementation Notes

### Backend Logic Flow

#### When Lender Accepts Loan:
1. Validate lender has sufficient funds
2. Update loan status to "approved"
3. Create investment record
4. Update funding progress
5. Send notification to borrower
6. Return success response

#### When Lender Rejects Loan:
1. Validate rejection reason is provided
2. Update loan status to "rejected"
3. Remove loan from lender's pending list
4. Send notification to borrower with reason
5. Log rejection for analytics
6. Return success response

#### Notification System:
1. Create notification record in database
2. Send real-time notification (WebSocket/SSE)
3. Send email notification (optional)
4. Update notification count in user profile

### Security Considerations
- Validate lender ownership of loan applications
- Sanitize rejection reasons to prevent XSS
- Rate limit notification creation
- Validate user permissions for all operations

### Performance Optimizations
- Index notifications by user_id and created_at
- Use pagination for notification lists
- Implement notification caching
- Use background jobs for notification sending

## Testing Endpoints

### Test Accept Loan
```bash
curl -X POST http://localhost:5000/api/lender/loan/loan_123/accept \
  -H "Authorization: Bearer <lender_token>" \
  -H "Content-Type: application/json" \
  -d '{"investmentAmount": 5000, "notes": "Great business plan"}'
```

### Test Reject Loan
```bash
curl -X POST http://localhost:5000/api/lender/loan/loan_123/reject \
  -H "Authorization: Bearer <lender_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient credit history"}'
```

### Test Get Notifications
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer <borrower_token>"
```

This API documentation provides the complete backend implementation needed to support the loan application management system with accept/reject functionality and notifications.
