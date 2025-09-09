# Notification API Implementation Guide

## Overview
This document provides the specific API endpoints that need to be implemented on the backend to support the notification system for loan applications.

## Required Notification Endpoints

### 1. Create Single Notification
```
POST /api/notifications/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_456",
  "type": "loan_funded",
  "title": "Loan Funded Successfully!",
  "message": "Your loan application for $5,000 has been funded and the amount has been added to your account balance.",
  "metadata": {
    "loanId": "loan_123",
    "amount": 5000,
    "lenderName": "Jane Smith",
    "transactionId": "txn_789",
    "borrowerBalance": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notificationId": "notif_789",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Create Multiple Notifications (Bulk)
```
POST /api/notifications/bulk-create
Authorization: Bearer <token>
Content-Type: application/json

{
  "notifications": [
    {
      "userId": "user_456",
      "type": "loan_funded",
      "title": "Loan Funded Successfully!",
      "message": "Your loan application has been funded.",
      "metadata": {
        "loanId": "loan_123",
        "amount": 5000
      }
    },
    {
      "userId": "admin_001",
      "type": "loan_funded",
      "title": "Loan Funding Completed",
      "message": "A loan has been funded by lender Jane Smith.",
      "metadata": {
        "loanId": "loan_123",
        "amount": 5000,
        "lenderName": "Jane Smith"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications created successfully",
  "data": {
    "createdCount": 2,
    "notificationIds": ["notif_789", "notif_790"]
  }
}
```

## Notification Types and Templates

### Loan Funded Notifications

#### Borrower Notification
```json
{
  "userId": "borrower_id",
  "type": "loan_funded",
  "title": "Loan Funded Successfully!",
  "message": "Your loan application for $5,000 has been funded and the amount has been added to your account balance.",
  "metadata": {
    "loanId": "loan_123",
    "amount": 5000,
    "lenderName": "Jane Smith",
    "transactionId": "txn_789",
    "borrowerBalance": 5000,
    "purpose": "business_expansion"
  }
}
```

#### Admin Notification
```json
{
  "userId": "admin_id",
  "type": "loan_funded",
  "title": "Loan Funding Completed",
  "message": "A loan application for $5,000 has been funded by lender Jane Smith.",
  "metadata": {
    "loanId": "loan_123",
    "amount": 5000,
    "lenderName": "Jane Smith",
    "borrowerName": "John Doe",
    "transactionId": "txn_789",
    "purpose": "business_expansion"
  }
}
```

### Loan Rejected Notifications

#### Borrower Notification
```json
{
  "userId": "borrower_id",
  "type": "loan_rejected",
  "title": "Loan Application Rejected",
  "message": "Your loan application for $5,000 has been rejected. Please review the reason and consider applying again.",
  "metadata": {
    "loanId": "loan_123",
    "amount": 5000,
    "lenderName": "Jane Smith",
    "reason": "Insufficient collateral or high risk profile",
    "purpose": "business_expansion"
  }
}
```

#### Admin Notification
```json
{
  "userId": "admin_id",
  "type": "loan_rejected",
  "title": "Loan Application Rejected",
  "message": "A loan application for $5,000 has been rejected by lender Jane Smith.",
  "metadata": {
    "loanId": "loan_123",
    "amount": 5000,
    "lenderName": "Jane Smith",
    "borrowerName": "John Doe",
    "reason": "Insufficient collateral or high risk profile",
    "purpose": "business_expansion"
  }
}
```

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type ENUM('loan_funded', 'loan_rejected', 'loan_accepted', 'loan_pending', 'payment_due', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
);
```

## Backend Implementation Examples

### Node.js/Express Implementation

```javascript
// Create single notification
app.post('/api/notifications/create', async (req, res) => {
  try {
    const { userId, type, title, message, metadata } = req.body;
    
    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create notification
    const notification = await Notification.create({
      id: generateId(),
      userId,
      type,
      title,
      message,
      metadata: metadata || {},
      isRead: false
    });
    
    // Send real-time notification (WebSocket/SSE)
    sendRealTimeNotification(userId, notification);
    
    res.json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notificationId: notification.id,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Create multiple notifications
app.post('/api/notifications/bulk-create', async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notifications array'
      });
    }
    
    const createdNotifications = [];
    
    for (const notificationData of notifications) {
      const notification = await Notification.create({
        id: generateId(),
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata || {},
        isRead: false
      });
      
      createdNotifications.push(notification);
      
      // Send real-time notification
      sendRealTimeNotification(notificationData.userId, notification);
    }
    
    res.json({
      success: true,
      message: 'Notifications created successfully',
      data: {
        createdCount: createdNotifications.length,
        notificationIds: createdNotifications.map(n => n.id)
      }
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notifications'
    });
  }
});
```

### Real-time Notification Function

```javascript
// WebSocket implementation for real-time notifications
function sendRealTimeNotification(userId, notification) {
  // Send to WebSocket clients
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: notification.createdAt
    });
  }
  
  // Send to Server-Sent Events
  if (sseClients[userId]) {
    sseClients[userId].write(`data: ${JSON.stringify({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: notification.createdAt
    })}\n\n`);
  }
}
```

## Integration with Loan Flow

### When Loan is Funded
```javascript
// After successful loan funding
const fundingResult = await processLoanFunding(loanId, amount, lenderId);

// Create notifications
const notifications = [
  {
    userId: fundingResult.borrowerId,
    type: 'loan_funded',
    title: 'Loan Funded Successfully!',
    message: `Your loan application for $${amount.toLocaleString()} has been funded and the amount has been added to your account balance.`,
    metadata: {
      loanId,
      amount,
      lenderName: fundingResult.lenderName,
      transactionId: fundingResult.transactionId,
      borrowerBalance: fundingResult.borrowerBalance
    }
  },
  {
    userId: 'admin',
    type: 'loan_funded',
    title: 'Loan Funding Completed',
    message: `A loan application for $${amount.toLocaleString()} has been funded by lender ${fundingResult.lenderName}.`,
    metadata: {
      loanId,
      amount,
      lenderName: fundingResult.lenderName,
      borrowerName: fundingResult.borrowerName,
      transactionId: fundingResult.transactionId
    }
  }
];

await createBulkNotifications(notifications);
```

### When Loan is Rejected
```javascript
// After loan rejection
const rejectionResult = await rejectLoanApplication(loanId, reason, lenderId);

// Create notifications
const notifications = [
  {
    userId: rejectionResult.borrowerId,
    type: 'loan_rejected',
    title: 'Loan Application Rejected',
    message: `Your loan application for $${rejectionResult.amount.toLocaleString()} has been rejected. Please review the reason and consider applying again.`,
    metadata: {
      loanId,
      amount: rejectionResult.amount,
      lenderName: rejectionResult.lenderName,
      reason,
      purpose: rejectionResult.purpose
    }
  },
  {
    userId: 'admin',
    type: 'loan_rejected',
    title: 'Loan Application Rejected',
    message: `A loan application for $${rejectionResult.amount.toLocaleString()} has been rejected by lender ${rejectionResult.lenderName}.`,
    metadata: {
      loanId,
      amount: rejectionResult.amount,
      lenderName: rejectionResult.lenderName,
      borrowerName: rejectionResult.borrowerName,
      reason,
      purpose: rejectionResult.purpose
    }
  }
];

await createBulkNotifications(notifications);
```

## Testing the Notification System

### Test Notification Creation
```bash
# Test single notification
curl -X POST http://localhost:5000/api/notifications/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "type": "loan_funded",
    "title": "Loan Funded Successfully!",
    "message": "Your loan application has been funded.",
    "metadata": {
      "loanId": "loan_123",
      "amount": 5000
    }
  }'

# Test bulk notifications
curl -X POST http://localhost:5000/api/notifications/bulk-create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {
        "userId": "user_456",
        "type": "loan_funded",
        "title": "Loan Funded!",
        "message": "Your loan has been funded."
      },
      {
        "userId": "admin",
        "type": "loan_funded",
        "title": "Funding Complete",
        "message": "A loan has been funded."
      }
    ]
  }'
```

## Security Considerations

1. **Input Validation**: Validate all notification data
2. **User Authorization**: Ensure users can only create notifications for themselves or admin
3. **Rate Limiting**: Limit notification creation to prevent spam
4. **Content Sanitization**: Sanitize notification content to prevent XSS
5. **Audit Logging**: Log all notification creation for security monitoring

This implementation guide provides everything needed to implement the notification system on the backend.
