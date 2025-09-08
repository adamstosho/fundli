# Paystack Error Handling Enhancement

## Overview

This document explains the enhanced error handling implemented for Paystack BVN and bank account verification services. The system now provides better user experience during service outages and technical difficulties.

## What Was Enhanced

### 1. **Enhanced Error Handling in PaystackService**
- **Status Code 451 (Service Unavailable)**: Now properly handled with user-friendly messages
- **Rate Limiting (429)**: Proper handling with retry suggestions
- **Server Errors (5xx)**: Better error categorization and recovery estimates
- **Error Codes**: Added structured error codes for better client-side handling

### 2. **Improved KYC Endpoint Responses**
- **HTTP Status Codes**: Proper status codes (503 for service unavailability, 429 for rate limiting)
- **Structured Error Responses**: Consistent error format with actionable information
- **User Guidance**: Clear suggestions on what to do next

### 3. **New Service Status Endpoint**
- **Route**: `GET /api/borrower/kyc/status`
- **Purpose**: Check Paystack service availability before KYC submission
- **Benefits**: Prevents unnecessary KYC attempts during service outages

### 4. **Retry Logic with Exponential Backoff**
- **Automatic Retries**: Up to 3 attempts with exponential backoff
- **Smart Retry Logic**: Won't retry on service unavailability errors
- **Configurable**: Easy to adjust retry parameters

## Error Response Format

### Service Unavailable (503)
```json
{
  "status": "error",
  "message": "BVN verification service is temporarily unavailable. Please try again later or contact support.",
  "errorCode": "SERVICE_UNAVAILABLE",
  "retryAfter": "1 hour",
  "alternativeMessage": "You can send us an email at support@paystack.com to make a request for the service",
  "suggestion": "Please try again later or contact our support team for assistance."
}
```

### Rate Limited (429)
```json
{
  "status": "error",
  "message": "Too many verification requests. Please try again later.",
  "errorCode": "RATE_LIMITED",
  "retryAfter": "15 minutes",
  "suggestion": "Please wait before attempting verification again."
}
```

### Server Error (503)
```json
{
  "status": "error",
  "message": "BVN verification service is experiencing technical difficulties. Please try again later.",
  "errorCode": "SERVER_ERROR",
  "retryAfter": "30 minutes",
  "suggestion": "This is a temporary issue. Please try again later."
}
```

## New API Endpoints

### Check Service Status
```http
GET /api/borrower/kyc/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "paystackService": {
      "success": false,
      "bvnService": "unavailable",
      "message": "BVN verification service is currently unavailable",
      "errorCode": "SERVICE_UNAVAILABLE",
      "estimatedRecovery": "1-2 hours",
      "contact": "support@paystack.com"
    },
    "canProceed": false,
    "message": "BVN verification service is currently unavailable",
    "estimatedRecovery": "1-2 hours",
    "contact": "support@paystack.com"
  }
}
```

## Usage Examples

### 1. Check Service Status Before KYC
```javascript
// Frontend: Check if KYC can proceed
const checkServiceStatus = async () => {
  try {
    const response = await api.get('/borrower/kyc/status');
    const { canProceed, estimatedRecovery, contact } = response.data.data;
    
    if (!canProceed) {
      showMessage(`Service unavailable. Estimated recovery: ${estimatedRecovery}`);
      showContactInfo(contact);
    } else {
      // Proceed with KYC form
      showKYCForm();
    }
  } catch (error) {
    console.error('Service status check failed:', error);
  }
};
```

### 2. Handle KYC Errors Gracefully
```javascript
// Frontend: Handle KYC submission errors
const submitKYC = async (kycData) => {
  try {
    const response = await api.post('/borrower/kyc', kycData);
    showSuccess('KYC submitted successfully!');
  } catch (error) {
    const { errorCode, message, retryAfter, suggestion } = error.response.data;
    
    switch (errorCode) {
      case 'SERVICE_UNAVAILABLE':
        showServiceUnavailable(message, retryAfter, suggestion);
        break;
      case 'RATE_LIMITED':
        showRateLimited(message, retryAfter, suggestion);
        break;
      case 'SERVER_ERROR':
        showServerError(message, retryAfter, suggestion);
        break;
      default:
        showGenericError(message);
    }
  }
};
```

## Testing

### Run Service Status Test
```bash
cd FUNDLI-Backend
node test-paystack-status.js
```

**Note**: Update `TEST_TOKEN` in the test file with a valid authentication token.

### Test Different Scenarios
1. **Service Available**: Normal operation
2. **Service Unavailable**: Simulate 451 error
3. **Rate Limited**: Simulate 429 error
4. **Server Error**: Simulate 5xx error

## Error Codes Reference

| Error Code | HTTP Status | Description | Action Required |
|------------|-------------|-------------|-----------------|
| `SERVICE_UNAVAILABLE` | 503 | Paystack service temporarily unavailable | Wait and retry later |
| `RATE_LIMITED` | 429 | Too many requests | Wait before retrying |
| `SERVER_ERROR` | 503 | Paystack server issues | Wait and retry later |
| `AUTH_ERROR` | 401 | Invalid API key | Check configuration |
| `VERIFICATION_FAILED` | 400 | Verification logic failed | Check input data |
| `MAX_RETRIES_EXCEEDED` | 500 | Retry attempts exhausted | Contact support |

## Best Practices

### 1. **Always Check Service Status First**
- Use `/kyc/status` endpoint before KYC submission
- Provide clear feedback to users about service availability

### 2. **Implement Proper Error Handling**
- Handle all error codes appropriately
- Show user-friendly messages with actionable suggestions
- Provide retry timing information

### 3. **User Communication**
- Be transparent about service issues
- Provide estimated recovery times
- Offer alternative contact methods

### 4. **Monitoring and Logging**
- Log all verification attempts and results
- Monitor error rates and patterns
- Set up alerts for service unavailability

## Troubleshooting

### Common Issues

1. **Service Unavailable (451)**
   - **Cause**: Paystack BVN service temporarily disabled
   - **Solution**: Wait for service restoration, check Paystack status page

2. **Rate Limiting (429)**
   - **Cause**: Too many requests in short time
   - **Solution**: Implement request throttling, respect retry-after headers

3. **Authentication Errors (401)**
   - **Cause**: Invalid or expired API key
   - **Solution**: Check environment variables, regenerate API key

### Debug Commands

```bash
# Test Paystack connection
node -e "require('./src/services/paystackService').testConnection().then(console.log)"

# Check service status
node -e "require('./src/services/paystackService').checkServiceStatus().then(console.log)"

# Test with specific BVN
node -e "require('./src/services/paystackService').verifyBVN('12345678901').then(console.log)"
```

## Support

For Paystack-specific issues:
- **Email**: support@paystack.com
- **Documentation**: https://paystack.com/docs
- **Status Page**: Check Paystack's service status

For application-specific issues:
- Check application logs
- Review error responses
- Test with the provided test scripts
