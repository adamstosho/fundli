# Paystack Configuration for Real Payments
# ==========================================

# 1. GET YOUR PAYSTACK KEYS
# -------------------------
# 1. Go to https://paystack.com
# 2. Sign up for an account
# 3. Go to Settings > API Keys & Webhooks
# 4. Copy your Public Key and Secret Key

# 2. ENVIRONMENT VARIABLES
# ------------------------
# Add these to your .env file in the FUNDLI-Backend directory:

# For TESTING (use test keys)
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key_here

# For PRODUCTION (use live keys)
# PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
# PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here

# 3. PAYSTACK ACCOUNT SETUP
# -------------------------
# 1. Complete your business verification
# 2. Add your bank account details
# 3. Set up webhook endpoints (optional but recommended)
# 4. Test with small amounts first

# 4. WEBHOOK CONFIGURATION (Optional)
# -----------------------------------
# Webhook URL: https://yourdomain.com/api/payments/webhook
# Events to listen for:
# - charge.success
# - charge.failed
# - transfer.success
# - transfer.failed

# 5. TESTING
# ----------
# 1. Use test keys for development
# 2. Test with Paystack test cards:
#    - Success: 4084084084084081
#    - Insufficient funds: 4084084084084085
#    - Wrong PIN: 4084084084084086
# 3. Test amounts should be in kobo (1 NGN = 100 kobo)

# 6. PRODUCTION CHECKLIST
# -----------------------
# [ ] Switch to live keys
# [ ] Update webhook URLs
# [ ] Test with real small amounts
# [ ] Monitor transaction logs
# [ ] Set up proper error handling
# [ ] Configure SSL certificates

# 7. SECURITY NOTES
# -----------------
# - Never commit real keys to version control
# - Use environment variables for all sensitive data
# - Implement proper error handling
# - Log all payment attempts
# - Use HTTPS in production
# - Validate all webhook signatures
