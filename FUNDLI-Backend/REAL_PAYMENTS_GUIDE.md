# 🚀 REAL PAYMENT SETUP GUIDE
# ===========================

## 📋 Quick Setup Checklist

### 1. Get Paystack Account
- [ ] Sign up at https://paystack.com
- [ ] Complete business verification
- [ ] Add bank account details
- [ ] Get your API keys

### 2. Configure Environment Variables
- [ ] Copy `env-template.txt` to `.env`
- [ ] Add your Paystack keys
- [ ] Set up database connection
- [ ] Configure JWT secret

### 3. Test Payment Flow
- [ ] Use test keys first
- [ ] Test with Paystack test cards
- [ ] Verify webhook handling
- [ ] Check loan status updates

### 4. Go Live
- [ ] Switch to live keys
- [ ] Update webhook URLs
- [ ] Test with small real amounts
- [ ] Monitor transaction logs

## 🔑 Paystack Test Cards

### Success Cards
```
4084084084084081 - Success
4084084084084082 - Success
4084084084084083 - Success
```

### Error Cards
```
4084084084084085 - Insufficient funds
4084084084084086 - Wrong PIN
4084084084084087 - Card declined
```

### Test Details
- **CVV**: Any 3 digits
- **PIN**: 1234
- **Expiry**: Any future date

## 💰 Currency & Amounts

### Supported Currencies
- **NGN** (Nigerian Naira) - Primary
- **USD** (US Dollar) - Secondary
- **GHS** (Ghana Cedi) - Available
- **ZAR** (South African Rand) - Available

### Amount Conversion
- **1 NGN = 100 kobo**
- **1 USD = 100 cents**
- Frontend sends: `amount` (e.g., 5000)
- Paystack receives: `amount * 100` (e.g., 500000)

## 🔒 Security Features

### Implemented
- ✅ Environment variable protection
- ✅ JWT authentication
- ✅ Input validation
- ✅ Error handling
- ✅ Webhook verification (basic)

### Recommended for Production
- [ ] Webhook signature verification
- [ ] SSL certificate
- [ ] Rate limiting
- [ ] Transaction logging
- [ ] Fraud detection

## 📊 Payment Flow

### 1. Lender Clicks "Accept"
```
Frontend → Backend → Paystack → User
```

### 2. Payment Process
```
1. Create payment intent
2. Initialize Paystack
3. User completes payment
4. Verify payment
5. Update loan status
6. Notify borrower
```

### 3. Webhook Handling
```
Paystack → Backend Webhook → Update Database
```

## 🛠️ Troubleshooting

### Common Issues

#### "Paystack not configured"
- Check `.env` file has correct keys
- Verify keys don't contain "your_" placeholder
- Restart server after adding keys

#### "Payment failed"
- Check Paystack dashboard for errors
- Verify webhook URL is accessible
- Check network connectivity

#### "Loan not updating"
- Check webhook is receiving events
- Verify loan ID in reference
- Check database connection

### Debug Steps
1. Check server logs
2. Verify Paystack dashboard
3. Test with small amounts
4. Check webhook delivery

## 📈 Monitoring

### Key Metrics
- Payment success rate
- Average transaction time
- Failed payment reasons
- Webhook delivery success

### Logs to Monitor
- Payment initialization
- Payment verification
- Webhook events
- Loan status changes

## 🚨 Production Checklist

### Before Going Live
- [ ] Switch to live Paystack keys
- [ ] Update webhook URLs to production
- [ ] Test with real small amounts
- [ ] Set up monitoring
- [ ] Configure SSL
- [ ] Set up error alerts

### Security
- [ ] Verify webhook signatures
- [ ] Use HTTPS everywhere
- [ ] Implement rate limiting
- [ ] Log all transactions
- [ ] Set up fraud detection

### Compliance
- [ ] PCI DSS compliance
- [ ] Data protection (GDPR)
- [ ] Financial regulations
- [ ] Audit logging

## 📞 Support

### Paystack Support
- Documentation: https://paystack.com/docs
- Support: support@paystack.com
- Status: https://status.paystack.com

### Development Support
- Check server logs
- Verify API responses
- Test with curl/Postman
- Check database state
