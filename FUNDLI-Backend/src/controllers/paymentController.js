const axios = require('axios');
const Wallet = require('../models/Wallet');
const Loan = require('../models/Loan');

// Create payment intent for Paystack
const createPaymentIntent = async (req, res) => {
  try {
    const { loanId, amount, currency = 'NGN' } = req.body;
    const lenderId = req.user.id;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can create payment intents'
      });
    }

    // Generate a unique reference
    const reference = `loan_${loanId}_${Date.now()}`;
    
    // Get lender's email from the request user
    const email = req.user.email;

    // Paystack configuration
    const paystackConfig = {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      baseUrl: 'https://api.paystack.co'
    };

    // Validate Paystack configuration
    if (!paystackConfig.publicKey || !paystackConfig.secretKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Paystack configuration missing. Please set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY in environment variables.'
      });
    }

    // Create payment intent on Paystack
    const paystackResponse = await axios.post(
      `${paystackConfig.baseUrl}/transaction/initialize`,
      {
        email: email,
        amount: amount * 100, // Convert to kobo
        currency: currency,
        reference: reference,
        metadata: {
          loanId: loanId,
          lenderId: lenderId,
          custom_fields: [
            {
              display_name: "Loan ID",
              variable_name: "loan_id",
              value: loanId
            },
            {
              display_name: "Lender ID", 
              variable_name: "lender_id",
              value: lenderId
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        publicKey: paystackConfig.publicKey,
        email: email,
        amount: amount,
        currency: currency,
        reference: reference,
        authorizationUrl: paystackResponse.data.data.authorization_url,
        accessCode: paystackResponse.data.data.access_code
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error.response) {
      console.error('Paystack error:', error.response.data);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent'
    });
  }
};

// Verify payment with Paystack
const verifyPayment = async (req, res) => {
  try {
    const { reference, loanId } = req.body;
    const lenderId = req.user.id;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can verify payments'
      });
    }

    // Paystack configuration
    const paystackConfig = {
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      baseUrl: 'https://api.paystack.co'
    };

    // Validate Paystack configuration
    if (!paystackConfig.secretKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Paystack configuration missing. Please set PAYSTACK_SECRET_KEY in environment variables.'
      });
    }

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `${paystackConfig.baseUrl}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = paystackResponse.data.data;

    // Check if payment was successful
    if (paymentData.status === 'success') {
      // Get or create lender's wallet
      let lenderWallet = await Wallet.findOne({ user: lenderId });
      if (!lenderWallet) {
        lenderWallet = await Wallet.create({ user: lenderId, balance: 0, currency: 'NGN' });
      }

      // Add funds to lender's wallet
      const transactionReference = `LOAN_PAYMENT_${loanId}_${Date.now()}`;
      const transaction = {
        type: 'loan_payment',
        amount: paymentData.amount / 100,
        currency: paymentData.currency,
        description: `Payment for loan ${loanId}`,
        reference: transactionReference,
        status: 'completed',
        loanId: loanId,
        externalReference: reference,
        metadata: {
          loanId: loanId,
          paymentMethod: 'paystack',
          paystackReference: reference
        },
        createdAt: new Date()
      };

      lenderWallet.addTransaction(transaction);
      lenderWallet.updateBalance(transaction.amount, 'add');
      await lenderWallet.save();

      // Call the loan acceptance endpoint
      const acceptResponse = await axios.post(
        `https://fundli-hjqn.vercel.app/api/loans/${loanId}/accept`,
        {
          paymentReference: reference,
          amount: paymentData.amount / 100 // Convert back from kobo
        },
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'Payment verified and loan accepted successfully',
        data: {
          paymentReference: reference,
          amount: paymentData.amount / 100,
          currency: paymentData.currency,
          status: paymentData.status,
          loanAcceptance: acceptResponse.data,
          wallet: {
            balance: lenderWallet.balance,
            currency: lenderWallet.currency
          }
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Payment verification failed',
        data: {
          status: paymentData.status,
          gateway_response: paymentData.gateway_response
        }
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    if (error.response) {
      console.error('Paystack verification error:', error.response.data);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify payment'
    });
  }
};

// Handle Paystack webhook
const handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const body = req.body;

    // Verify webhook signature (in production, you should verify this)
    // For now, we'll process the webhook directly
    
    if (body.event === 'charge.success') {
      const { reference, amount, customer } = body.data;
      
      console.log('Payment successful via webhook:', {
        reference,
        amount: amount / 100, // Convert from kobo
        customer: customer.email
      });

      // Extract loan ID from reference
      const loanIdMatch = reference.match(/loan_(\w+)_/);
      if (loanIdMatch) {
        const loanId = loanIdMatch[1];
        
        // Update loan status
        const Loan = require('../models/Loan');
        const loan = await Loan.findById(loanId);
        
        if (loan && loan.status === 'pending') {
          loan.status = 'approved';
          loan.fundingProgress.fundedAmount = amount / 100;
          loan.fundingProgress.investors.push({
            user: customer.metadata?.lenderId,
            amount: amount / 100,
            investedAt: new Date()
          });
          
          // Check if fully funded
          if (loan.fundingProgress.fundedAmount >= loan.loanAmount) {
            loan.status = 'funded';
            loan.fundedAt = new Date();
          }
          
          await loan.save();
          console.log('Loan updated via webhook:', loanId);
        }
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ status: 'error' });
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
  handlePaystackWebhook
};
