const axios = require('axios');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Loan = require('../models/Loan');
const LendingPool = require('../models/LendingPool');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseURL = 'https://api.paystack.co';
    
    if (!this.secretKey) {
      console.error('❌ PAYSTACK_SECRET_KEY environment variable is required');
      throw new Error('PAYSTACK_SECRET_KEY environment variable is required');
    }
    
    console.log('✅ PaystackService initialized with secret key:', this.secretKey.substring(0, 10) + '...');
  }

  // Get headers for API requests
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Initialize a Paystack payment
  async initializePayment(paymentData, user) {
    try {
      // Create transaction record
      const transaction = new Transaction({
        type: paymentData.type,
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        sender: user._id,
        recipient: paymentData.recipient || user._id,
        paymentMethod: paymentData.paymentMethod || 'card',
        relatedEntities: paymentData.relatedEntities,
        description: paymentData.description,
        status: 'pending',
        metadata: {
          ipAddress: paymentData.ipAddress,
          userAgent: paymentData.userAgent
        }
      });
      await transaction.save();

      // Prepare payload for Paystack
      const amountInKobo = Math.round(paymentData.amount * 100);
      const payload = {
        email: user.email,
        amount: amountInKobo,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          transactionId: transaction._id.toString(),
          userId: user._id.toString(),
          type: paymentData.type
        }
      };

      const response = await axios.post(`${this.baseURL}/transaction/initialize`, payload, {
        headers: this.getHeaders()
      });

      if (response.data.status === true) {
        // Store reference and authorization URL
        transaction.paymentDetails.gateway = 'paystack';
        transaction.paymentDetails.reference = response.data.data.reference;
        await transaction.save();

        return {
          success: true,
          transactionId: transaction.transactionId,
          paymentUrl: response.data.data.authorization_url,
          reference: response.data.data.reference,
          message: 'Payment initialized successfully'
        };
      }

      throw new Error(response.data.message || 'Failed to initialize Paystack payment');
    } catch (error) {
      console.error('❌ Paystack initializePayment error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Verify Paystack payment by reference
  async verifyPayment(reference) {
    try {
      const response = await axios.get(`${this.baseURL}/transaction/verify/${reference}`, {
        headers: this.getHeaders()
      });

      if (response.data.status === true) {
        const data = response.data.data;

        // Find transaction by reference
        const transaction = await Transaction.findOne({ 'paymentDetails.reference': reference });
        if (!transaction) throw new Error('Transaction not found for reference');

        transaction.status = data.status === 'success' ? 'completed' : 'failed';
        transaction.paymentDetails.gatewayTransactionId = data.id;
        await transaction.save();

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
      }

      throw new Error(response.data.message || 'Paystack verification failed');
    } catch (error) {
      console.error('❌ Paystack verifyPayment error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Process Paystack webhook
  async processWebhook(payload, signature) {
    try {
      // Verify signature (x-paystack-signature)
      const secret = this.secretKey;
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
      if (hash !== signature) {
        throw new Error('Invalid Paystack webhook signature');
      }

      const event = payload.event;
      const data = payload.data;

      // Handle charge.success
      if (event === 'charge.success') {
        const reference = data.reference;
        const transaction = await Transaction.findOne({ 'paymentDetails.reference': reference });
        if (!transaction) throw new Error('Transaction not found for webhook');
        transaction.status = 'completed';
        transaction.paymentDetails.gatewayTransactionId = data.id;
        await transaction.save();
        await this.processPostPaymentActions(transaction);
        return { success: true, message: 'Webhook processed' };
      }

      return { success: true, message: 'Event ignored' };
    } catch (error) {
      console.error('❌ Paystack webhook error:', error.message);
      throw error;
    }
  }

  // Post-payment actions similar to Flutterwave service
  async processPostPaymentActions(transaction) {
    try {
      switch (transaction.type) {
        case 'loan_repayment': {
          const loan = await Loan.findById(transaction.relatedEntities.loan);
          if (!loan) break;
          loan.amountRemaining -= transaction.amount;
          loan.amountPaid += transaction.amount;
          const nextPayment = loan.repayments?.find(r => r.status === 'pending');
          if (nextPayment && transaction.amount >= nextPayment.amount) {
            nextPayment.status = 'paid';
            nextPayment.paidAt = new Date();
            nextPayment.transactionId = transaction.transactionId;
          }
          if (loan.amountRemaining <= 0) {
            loan.status = 'completed';
            loan.completedAt = new Date();
          }
          await loan.save();
          break;
        }
        case 'investment': {
          const pool = await LendingPool.findById(transaction.relatedEntities.pool);
          if (!pool) break;
          pool.investors.push({
            user: transaction.sender,
            amount: transaction.amount,
            investedAt: new Date(),
            transactionId: transaction.transactionId
          });
          pool.fundedAmount = (pool.fundedAmount || 0) + transaction.amount;
          pool.totalInvested = (pool.totalInvested || 0) + transaction.amount;
          if (pool.fundedAmount >= pool.poolSize) {
            pool.status = 'funded';
            pool.fundedAt = new Date();
          }
          await pool.save();
          break;
        }
        case 'wallet_funding': {
          await User.findByIdAndUpdate(transaction.sender, { $inc: { walletBalance: transaction.amount } });
          break;
        }
        case 'wallet_withdrawal': {
          await User.findByIdAndUpdate(transaction.sender, { $inc: { walletBalance: -transaction.amount } });
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error('❌ Paystack post-payment action error:', error.message);
    }
  }

  // Verify BVN using the correct Paystack endpoint
  async verifyBVN(bvn) {
    try {
      console.log(`🔍 Verifying BVN: ${bvn}`);
      
      // Paystack BVN verification endpoint
      const response = await axios.get(
        `${this.baseURL}/bank/resolve_bvn/${bvn}`,
        { 
          headers: this.getHeaders(),
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('📡 Paystack BVN response:', response.data);

      if (response.data.status === true) {
        return {
          success: true,
          data: response.data.data,
          message: 'BVN verified successfully'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'BVN verification failed'
        };
      }
    } catch (error) {
      console.error('❌ Paystack BVN verification error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        bvn: bvn
      });
      
      // Handle specific error status codes
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'BVN not found or invalid'
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid Paystack API key'
        };
      }
      
      if (error.response?.status === 422) {
        return {
          success: false,
          message: 'Invalid BVN format'
        };
      }
      
      // Handle service unavailability (451)
      if (error.response?.status === 451) {
        const errorData = error.response?.data;
        if (errorData?.code === 'feature_unavailable') {
          return {
            success: false,
            message: 'BVN verification service is temporarily unavailable. Please try again later or contact support.',
            errorCode: 'SERVICE_UNAVAILABLE',
            retryAfter: '1 hour',
            alternativeMessage: 'You can send us an email at support@paystack.com to make a request for the service'
          };
        }
      }
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        return {
          success: false,
          message: 'Too many verification requests. Please try again later.',
          errorCode: 'RATE_LIMITED',
          retryAfter: '15 minutes'
        };
      }
      
      // Handle server errors
      if (error.response?.status >= 500) {
        return {
          success: false,
          message: 'BVN verification service is experiencing technical difficulties. Please try again later.',
          errorCode: 'SERVER_ERROR',
          retryAfter: '30 minutes'
        };
      }
      
      return {
        success: false,
        message: `BVN verification failed: ${error.response?.data?.message || error.message}`,
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  // Verify bank account using the correct Paystack endpoint
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      console.log(`🔍 Verifying bank account: ${accountNumber} (Bank: ${bankCode})`);
      
      // Paystack bank account verification endpoint
      const response = await axios.get(
        `${this.baseURL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { 
          headers: this.getHeaders(),
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('📡 Paystack bank account response:', response.data);

      if (response.data.status === true) {
        return {
          success: true,
          data: response.data.data,
          message: 'Bank account verified successfully'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Bank account verification failed'
        };
      }
    } catch (error) {
      console.error('❌ Paystack bank account verification error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        accountNumber: accountNumber,
        bankCode: bankCode
      });
      
      // Handle specific error status codes
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Bank account not found or invalid'
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid Paystack API key'
        };
      }
      
      if (error.response?.status === 422) {
        return {
          success: false,
          message: 'Invalid account number or bank code format'
        };
      }
      
      // Handle service unavailability (451)
      if (error.response?.status === 451) {
        const errorData = error.response?.data;
        if (errorData?.code === 'feature_unavailable') {
          return {
            success: false,
            message: 'Bank account verification service is temporarily unavailable. Please try again later or contact support.',
            errorCode: 'SERVICE_UNAVAILABLE',
            retryAfter: '1 hour',
            alternativeMessage: 'You can send us an email at support@paystack.com to make a request for the service'
          };
        }
      }
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        return {
          success: false,
          message: 'Too many verification requests. Please try again later.',
          errorCode: 'RATE_LIMITED',
          retryAfter: '15 minutes'
        };
      }
      
      // Handle server errors
      if (error.response?.status >= 500) {
        return {
          success: false,
          message: 'Bank account verification service is experiencing technical difficulties. Please try again later.',
          errorCode: 'SERVER_ERROR',
          retryAfter: '30 minutes'
        };
      }
      
      return {
        success: false,
        message: `Bank account verification failed: ${error.response?.data?.message || error.message}`,
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  // Get list of banks
  async getBanks() {
    try {
      console.log('🔍 Fetching banks list from Paystack');
      
      const response = await axios.get(
        `${this.baseURL}/bank`,
        { 
          headers: this.getHeaders(),
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('📡 Paystack banks response status:', response.data.status);

      if (response.data.status === true) {
        return {
          success: true,
          data: response.data.data,
          message: 'Banks retrieved successfully'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to retrieve banks'
        };
      }
    } catch (error) {
      console.error('❌ Paystack get banks error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid Paystack API key'
        };
      }
      
      return {
        success: false,
        message: `Failed to retrieve banks: ${error.response?.data?.message || error.message}`
      };
    }
  }

  // Test Paystack connection
  async testConnection() {
    try {
      console.log('🔍 Testing Paystack connection...');
      
      const response = await axios.get(
        `${this.baseURL}/bank`,
        { 
          headers: this.getHeaders(),
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.status === true) {
        console.log('✅ Paystack connection successful');
        return {
          success: true,
          message: 'Paystack connection successful'
        };
      } else {
        console.log('❌ Paystack connection failed:', response.data.message);
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('❌ Paystack connection test failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        message: `Connection test failed: ${error.response?.data?.message || error.message}`
      };
    }
  }

  // Check Paystack service status specifically for BVN and bank verification
  async checkServiceStatus() {
    try {
      console.log('🔍 Checking Paystack service status...');
      
      // Test BVN endpoint specifically
      const bvnResponse = await axios.get(
        `${this.baseURL}/bank/resolve_bvn/12345678901`, // Test with dummy BVN
        { 
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      return {
        success: true,
        bvnService: 'available',
        message: 'All Paystack services are operational'
      };
    } catch (error) {
      console.log('📡 Paystack service status check result:', {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message
      });

      if (error.response?.status === 451 && error.response?.data?.code === 'feature_unavailable') {
        return {
          success: false,
          bvnService: 'unavailable',
          message: 'BVN verification service is currently unavailable',
          errorCode: 'SERVICE_UNAVAILABLE',
          estimatedRecovery: '1-2 hours',
          contact: 'support@paystack.com'
        };
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid API key - please check your Paystack configuration',
          errorCode: 'AUTH_ERROR'
        };
      }

      if (error.response?.status >= 500) {
        return {
          success: false,
          message: 'Paystack services are experiencing technical difficulties',
          errorCode: 'SERVER_ERROR',
          estimatedRecovery: '30 minutes'
        };
      }

      return {
        success: false,
        message: `Service status check failed: ${error.response?.data?.message || error.message}`,
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  // Retry verification with exponential backoff
  async retryVerification(verificationMethod, params, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt} of ${maxRetries} for ${verificationMethod}`);
        
        let result;
        if (verificationMethod === 'bvn') {
          result = await this.verifyBVN(params.bvn);
        } else if (verificationMethod === 'bank') {
          result = await this.verifyBankAccount(params.accountNumber, params.bankCode);
        } else {
          throw new Error(`Unknown verification method: ${verificationMethod}`);
        }

        if (result.success) {
          console.log(`✅ ${verificationMethod} verification successful on attempt ${attempt}`);
          return result;
        }

        // If it's a service unavailability error, don't retry
        if (result.errorCode === 'SERVICE_UNAVAILABLE') {
          console.log(`❌ ${verificationMethod} service unavailable, not retrying`);
          return result;
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    return {
      success: false,
      message: `Verification failed after ${maxRetries} attempts`,
      errorCode: 'MAX_RETRIES_EXCEEDED'
    };
  }
}

module.exports = new PaystackService();
