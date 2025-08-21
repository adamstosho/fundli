const axios = require('axios');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Loan = require('../models/Loan');
const LendingPool = require('../models/LendingPool');

class FlutterwaveService {
  constructor() {
    this.baseUrl = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    this.encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    this.webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    
    if (!this.secretKey || !this.publicKey) {
      console.warn('⚠️ Flutterwave keys not configured. Payments will be simulated.');
    }
  }

  /**
   * Initialize a payment transaction
   * @param {Object} paymentData - Payment data
   * @param {Object} user - User making payment
   * @returns {Promise<Object>} Payment initialization result
   */
  async initializePayment(paymentData, user) {
    try {
      // Create transaction record
      const transaction = new Transaction({
        type: paymentData.type,
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        sender: user._id,
        recipient: paymentData.recipient || 'platform',
        paymentMethod: paymentData.paymentMethod,
        relatedEntities: paymentData.relatedEntities,
        description: paymentData.description,
        metadata: {
          ipAddress: paymentData.ipAddress,
          userAgent: paymentData.userAgent
        }
      });

      // Generate Flutterwave transaction reference
      const txRef = `FUNDLI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Set Flutterwave specific details
      transaction.paymentDetails.gateway = 'flutterwave';
      transaction.paymentDetails.flutterwave.txRef = txRef;
      transaction.paymentDetails.flutterwave.customerEmail = user.email;
      transaction.paymentDetails.flutterwave.customerPhone = user.phone;
      transaction.paymentDetails.flutterwave.customerName = `${user.firstName} ${user.lastName}`;

      // Save transaction
      await transaction.save();

      // If Flutterwave is not configured, simulate payment
      if (!this.secretKey) {
        return this.simulatePayment(transaction);
      }

      // Prepare Flutterwave payload
      const payload = {
        tx_ref: txRef,
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: {
          email: user.email,
          phone_number: user.phone,
          name: `${user.firstName} ${user.lastName}`
        },
        customizations: {
          title: 'Fundli Payment',
          description: paymentData.description,
          logo: `${process.env.FRONTEND_URL}/logo.png`
        },
        meta: {
          transactionId: transaction._id.toString(),
          userId: user._id.toString(),
          type: paymentData.type
        }
      };

      // Add payment method specific data
      if (paymentData.paymentMethod === 'bank_transfer') {
        payload.payment_options = 'banktransfer';
      } else if (paymentData.paymentMethod === 'mobile_money') {
        payload.payment_options = 'mobilemoney';
      } else if (paymentData.paymentMethod === 'card_payment') {
        payload.payment_options = 'card';
      }

      // Make request to Flutterwave
      const response = await axios.post(`${this.baseUrl}/payments`, payload, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        // Update transaction with Flutterwave response
        transaction.paymentDetails.flutterwave.orderRef = response.data.data.order_ref;
        transaction.paymentDetails.flutterwave.paymentPage = response.data.data.link;
        transaction.paymentDetails.flutterwave.hostedPage = response.data.data.link;
        await transaction.save();

        return {
          success: true,
          transactionId: transaction.transactionId,
          paymentUrl: response.data.data.link,
          txRef: txRef,
          message: 'Payment initialized successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('❌ Payment initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify payment transaction
   * @param {string} transactionId - Transaction ID to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(transactionId) {
    try {
      // Find transaction
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // If Flutterwave is not configured, simulate verification
      if (!this.secretKey) {
        return this.simulateVerification(transaction);
      }

      // Get Flutterwave transaction reference
      const txRef = transaction.paymentDetails.flutterwave.txRef;
      if (!txRef) {
        throw new Error('Flutterwave transaction reference not found');
      }

      // Verify with Flutterwave
      const response = await axios.get(`${this.baseUrl}/transactions/${txRef}/verify`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`
        }
      });

      if (response.data.status === 'success') {
        const paymentData = response.data.data;
        
        // Update transaction with verification details
        transaction.status = paymentData.status === 'successful' ? 'completed' : 'failed';
        transaction.paymentDetails.gatewayTransactionId = paymentData.id;
        transaction.paymentDetails.flutterwave.chargeResponseCode = paymentData.charge_response_code;
        transaction.paymentDetails.flutterwave.chargeResponseMessage = paymentData.charge_response_message;
        transaction.paymentDetails.flutterwave.raveRef = paymentData.rave_ref;
        
        if (paymentData.status === 'successful') {
          transaction.processingCompletedAt = new Date();
          transaction.processingDuration = Date.now() - transaction.createdAt.getTime();
        } else {
          transaction.failureReason = paymentData.charge_response_message;
        }

        await transaction.save();

        // Process post-payment actions
        if (transaction.status === 'completed') {
          await this.processPostPaymentActions(transaction);
        }

        return {
          success: true,
          status: transaction.status,
          message: `Payment ${transaction.status}`,
          data: {
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status
          }
        };
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }

    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Process webhook from Flutterwave
   * @param {Object} webhookData - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {Promise<Object>} Webhook processing result
   */
  async processWebhook(webhookData, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { tx_ref, status, transaction_id, amount, currency } = webhookData;

      // Find transaction by tx_ref
      const transaction = await Transaction.findOne({
        'paymentDetails.flutterwave.txRef': tx_ref
      });

      if (!transaction) {
        throw new Error('Transaction not found for webhook');
      }

      // Update transaction status
      if (status === 'successful') {
        transaction.status = 'completed';
        transaction.processingCompletedAt = new Date();
        transaction.paymentDetails.gatewayTransactionId = transaction_id;
        transaction.paymentDetails.flutterwave.chargeResponseCode = '00';
        transaction.paymentDetails.flutterwave.chargeResponseMessage = 'Payment successful';
      } else {
        transaction.status = 'failed';
        transaction.failureReason = webhookData.charge_response_message || 'Payment failed';
      }

      await transaction.save();

      // Process post-payment actions if successful
      if (transaction.status === 'completed') {
        await this.processPostPaymentActions(transaction);
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
        transactionId: transaction.transactionId
      };

    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Process post-payment actions
   * @param {Object} transaction - Completed transaction
   */
  async processPostPaymentActions(transaction) {
    try {
      switch (transaction.type) {
        case 'loan_repayment':
          await this.processLoanRepayment(transaction);
          break;
        case 'investment':
          await this.processInvestment(transaction);
          break;
        case 'wallet_funding':
          await this.processWalletFunding(transaction);
          break;
        case 'wallet_withdrawal':
          await this.processWalletWithdrawal(transaction);
          break;
        case 'referral_reward':
          await this.processReferralReward(transaction);
          break;
      }
    } catch (error) {
      console.error('❌ Post-payment actions failed:', error);
    }
  }

  /**
   * Process loan repayment
   * @param {Object} transaction - Transaction object
   */
  async processLoanRepayment(transaction) {
    try {
      const loan = await Loan.findById(transaction.relatedEntities.loan);
      if (!loan) return;

      // Update loan amount remaining
      loan.amountRemaining -= transaction.amount;
      loan.amountPaid += transaction.amount;

      // Update repayment schedule
      const nextPayment = loan.repayments.find(r => r.status === 'pending');
      if (nextPayment && transaction.amount >= nextPayment.amount) {
        nextPayment.status = 'paid';
        nextPayment.paidAt = new Date();
        nextPayment.transactionId = transaction.transactionId;
      }

      // Check if loan is fully repaid
      if (loan.amountRemaining <= 0) {
        loan.status = 'completed';
        loan.completedAt = new Date();
      }

      await loan.save();

    } catch (error) {
      console.error('❌ Loan repayment processing failed:', error);
    }
  }

  /**
   * Process investment
   * @param {Object} transaction - Transaction object
   */
  async processInvestment(transaction) {
    try {
      const pool = await LendingPool.findById(transaction.relatedEntities.pool);
      if (!pool) return;

      // Add investor to pool
      pool.investors.push({
        user: transaction.sender,
        amount: transaction.amount,
        investedAt: new Date(),
        transactionId: transaction.transactionId
      });

      // Update pool funding
      pool.fundedAmount += transaction.amount;
      pool.totalInvested += transaction.amount;

      // Check if pool is fully funded
      if (pool.fundedAmount >= pool.poolSize) {
        pool.status = 'funded';
        pool.fundedAt = new Date();
      }

      await pool.save();

    } catch (error) {
      console.error('❌ Investment processing failed:', error);
    }
  }

  /**
   * Process wallet funding
   * @param {Object} transaction - Transaction object
   */
  async processWalletFunding(transaction) {
    try {
      await User.findByIdAndUpdate(transaction.sender, {
        $inc: { walletBalance: transaction.amount }
      });
    } catch (error) {
      console.error('❌ Wallet funding failed:', error);
    }
  }

  /**
   * Process wallet withdrawal
   * @param {Object} transaction - Transaction object
   */
  async processWalletWithdrawal(transaction) {
    try {
      await User.findByIdAndUpdate(transaction.sender, {
        $inc: { walletBalance: -transaction.amount }
      });
    } catch (error) {
      console.error('❌ Wallet withdrawal failed:', error);
    }
  }

  /**
   * Process referral reward
   * @param {Object} transaction - Transaction object
   */
  async processReferralReward(transaction) {
    try {
      await User.findByIdAndUpdate(transaction.recipient, {
        $inc: { walletBalance: transaction.amount }
      });
    } catch (error) {
      console.error('❌ Referral reward processing failed:', error);
    }
  }

  /**
   * Verify webhook signature
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Signature validity
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) return true; // Skip verification if secret not configured
    
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Simulate payment (for development/testing)
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Object>} Simulated payment result
   */
  async simulatePayment(transaction) {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark as completed
    transaction.status = 'completed';
    transaction.processingCompletedAt = new Date();
    transaction.processingDuration = Date.now() - transaction.createdAt.getTime();
    await transaction.save();

    // Process post-payment actions
    await this.processPostPaymentActions(transaction);

    return {
      success: true,
      transactionId: transaction.transactionId,
      paymentUrl: `${process.env.FRONTEND_URL}/payment/simulate/${transaction.transactionId}`,
      txRef: transaction.paymentDetails.flutterwave.txRef,
      message: 'Simulated payment completed successfully'
    };
  }

  /**
   * Simulate verification (for development/testing)
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Object>} Simulated verification result
   */
  async simulateVerification(transaction) {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      status: transaction.status,
      message: 'Simulated payment verification completed',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status
      }
    };
  }

  /**
   * Get supported payment methods
   * @returns {Array} Available payment methods
   */
  getSupportedPaymentMethods() {
    return [
      {
        id: 'card_payment',
        name: 'Credit/Debit Card',
        description: 'Pay with your card',
        icon: 'credit-card',
        available: true,
        processingTime: 'Instant'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: 'bank',
        available: true,
        processingTime: '1-3 business days'
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        description: 'Pay using mobile money',
        icon: 'smartphone',
        available: true,
        processingTime: 'Instant'
      },
      {
        id: 'ussd',
        name: 'USSD',
        description: 'Phone-based payments',
        icon: 'phone',
        available: true,
        processingTime: 'Instant'
      },
      {
        id: 'qr_code',
        name: 'QR Code',
        description: 'Scan QR code to pay',
        icon: 'qr-code',
        available: true,
        processingTime: 'Instant'
      }
    ];
  }
}

module.exports = new FlutterwaveService(); 