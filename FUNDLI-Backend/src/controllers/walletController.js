const Wallet = require('../models/Wallet');
const User = require('../models/User');
const axios = require('axios');

// Generate unique transaction reference
const generateTransactionReference = (type) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${type.toUpperCase()}_${timestamp}_${random}`;
};

// Create wallet for user
const createWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ user: userId });
    if (existingWallet) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet already exists for this user'
      });
    }

    // Create new wallet
    const wallet = await Wallet.create({
      user: userId,
      balance: 0,
      currency: 'USD'
    });

    res.status(201).json({
      status: 'success',
      message: 'Wallet created successfully',
      data: {
        wallet: {
          id: wallet._id,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create wallet'
    });
  }
};

// Get wallet details
const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🔍 General wallet endpoint - User ID:', userId);
    console.log('🔍 General wallet endpoint - User email:', req.user.email);
    console.log('🔍 General wallet endpoint - User type:', req.user.userType);

    const wallet = await Wallet.findOne({ user: userId })
      .populate('user', 'firstName lastName email userType');

    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }

    console.log('🔍 General wallet endpoint - Wallet balance:', wallet.balance);

    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          id: wallet._id,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
          limits: wallet.limits,
          stats: wallet.stats,
          dailyUsage: wallet.dailyUsage,
          monthlyUsage: wallet.monthlyUsage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wallet details'
    });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, status } = req.query;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }

    let transactions = wallet.transactions;

    // Filter by type if provided
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Filter by status if provided
    if (status) {
      transactions = transactions.filter(t => t.status === status);
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      data: {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.length / limit),
          totalTransactions: transactions.length,
          hasNext: endIndex < transactions.length,
          hasPrev: startIndex > 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions'
    });
  }
};

// Deposit funds to wallet
const depositFunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'NGN', paymentMethod = 'card' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount'
      });
    }

    // Get or create wallet
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0, currency });
    }

    // Check limits
    const limitCheck = wallet.checkLimits('deposit', amount);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        status: 'error',
        message: limitCheck.reason
      });
    }

    // Generate transaction reference
    const reference = generateTransactionReference('deposit');

    // Handle different payment methods
    switch (paymentMethod) {
      case 'card':
        return await handleCardPayment(req, res, wallet, amount, currency, reference);
      case 'bank':
        return await handleBankTransfer(req, res, wallet, amount, currency, reference);
      case 'mobile':
        return await handleMobileMoney(req, res, wallet, amount, currency, reference);
      default:
        return await handleCardPayment(req, res, wallet, amount, currency, reference);
    }

  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process deposit'
    });
  }
};

// Handle card payment with Paystack
const handleCardPayment = async (req, res, wallet, amount, currency, reference) => {
  try {
    const paystackConfig = {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_demo',
      secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_demo',
      baseUrl: 'https://api.paystack.co'
    };

    // For development/testing, simulate payment without actual Paystack integration
    if (!process.env.PAYSTACK_PUBLIC_KEY || !process.env.PAYSTACK_SECRET_KEY) {
      console.log('Paystack not configured, simulating payment for development');
      
      // Simulate successful payment
      const transaction = {
        type: 'deposit',
        amount: amount,
        currency: currency,
        description: `Wallet deposit via Card Payment (Simulated)`,
        reference: reference,
        status: 'completed',
        externalReference: `sim_${reference}`,
        metadata: {
          paymentMethod: 'card',
          simulated: true
        }
      };

      // Add transaction to wallet
      wallet.addTransaction(transaction);
      wallet.updateBalance(amount, 'deposit');
      await wallet.save();

      return res.status(200).json({
        status: 'success',
        message: 'Deposit successful (simulated)',
        data: {
          transaction,
          wallet: {
            balance: wallet.balance,
            currency: wallet.currency
          }
        }
      });
    }

    const paystackResponse = await axios.post(
      `${paystackConfig.baseUrl}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amount * 100, // Convert to kobo
        currency: currency,
        reference: reference,
        metadata: {
          userId: req.user.id,
          walletId: wallet._id,
          transactionType: 'wallet_deposit',
          paymentMethod: 'card'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Add pending transaction to wallet
    const transaction = {
      type: 'deposit',
      amount: amount,
      currency: currency,
      description: `Wallet deposit via Card Payment`,
      reference: reference,
      status: 'pending',
      externalReference: paystackResponse.data.data.reference,
      metadata: {
        paystackReference: paystackResponse.data.data.reference,
        authorizationUrl: paystackResponse.data.data.authorization_url,
        paymentMethod: 'card'
      },
      createdAt: new Date()
    };

    wallet.addTransaction(transaction);
    await wallet.save();

    res.status(200).json({
      status: 'success',
      message: 'Card payment initialized successfully',
      data: {
        reference: reference,
        amount: amount,
        currency: currency,
        authorizationUrl: paystackResponse.data.data.authorization_url,
        publicKey: paystackConfig.publicKey,
        user: {
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error('Error with card payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize card payment'
    });
  }
};

// Handle bank transfer
const handleBankTransfer = async (req, res, wallet, amount, currency, reference) => {
  try {
    // For development/testing, simulate successful bank transfer
    if (!process.env.PAYSTACK_PUBLIC_KEY || !process.env.PAYSTACK_SECRET_KEY) {
      console.log('Simulating bank transfer for development');
      
      const transaction = {
        type: 'deposit',
        amount: amount,
        currency: currency,
        description: `Wallet deposit via Bank Transfer (Simulated)`,
        reference: reference,
        status: 'completed',
        externalReference: `sim_bank_${reference}`,
        metadata: {
          paymentMethod: 'bank_transfer',
          simulated: true,
          bankDetails: {
            accountNumber: '1234567890',
            accountName: 'FUNDLI WALLET',
            bankName: 'Access Bank',
            bankCode: '044'
          }
        },
        createdAt: new Date()
      };

      // Add transaction to wallet and update balance
      wallet.addTransaction(transaction);
      wallet.updateBalance(amount, 'deposit');
      await wallet.save();

      return res.status(200).json({
        status: 'success',
        message: 'Bank transfer successful (simulated)',
        data: {
          transaction,
          wallet: {
            balance: wallet.balance,
            currency: wallet.currency
          }
        }
      });
    }

    // For production, create pending transaction
    const transaction = {
      type: 'deposit',
      amount: amount,
      currency: currency,
      description: `Wallet deposit via Bank Transfer`,
      reference: reference,
      status: 'pending',
      metadata: {
        paymentMethod: 'bank_transfer',
        bankDetails: {
          accountNumber: '1234567890',
          accountName: 'FUNDLI WALLET',
          bankName: 'Access Bank',
          bankCode: '044'
        }
      },
      createdAt: new Date()
    };

    wallet.addTransaction(transaction);
    await wallet.save();

    res.status(200).json({
      status: 'success',
      message: 'Bank transfer details generated successfully',
      data: {
        reference: reference,
        amount: amount,
        currency: currency,
        bankDetails: {
          accountNumber: '1234567890',
          accountName: 'FUNDLI WALLET',
          bankName: 'Access Bank',
          bankCode: '044'
        },
        instructions: 'Transfer the exact amount to the account above and include the reference number. Your wallet will be credited within 24 hours after confirmation.'
      }
    });
  } catch (error) {
    console.error('Error with bank transfer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process bank transfer'
    });
  }
};

// Handle mobile money payment
const handleMobileMoney = async (req, res, wallet, amount, currency, reference) => {
  try {
    // Add pending transaction to wallet
    const transaction = {
      type: 'deposit',
      amount: amount,
      currency: currency,
      description: `Wallet deposit via Mobile Money`,
      reference: reference,
      status: 'pending',
      metadata: {
        paymentMethod: 'mobile_money',
        mobileDetails: {
          provider: 'MTN Mobile Money',
          number: '08012345678',
          providerCode: 'MTN'
        }
      },
      createdAt: new Date()
    };

    wallet.addTransaction(transaction);
    await wallet.save();

    res.status(200).json({
      status: 'success',
      message: 'Mobile money payment details generated successfully',
      data: {
        reference: reference,
        amount: amount,
        currency: currency,
        mobileDetails: {
          provider: 'MTN Mobile Money',
          number: '08012345678',
          providerCode: 'MTN'
        },
        instructions: 'Send the exact amount to the number above and include the reference. Your wallet will be credited within 2 hours after confirmation.'
      }
    });
  } catch (error) {
    console.error('Error with mobile money:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process mobile money payment'
    });
  }
};

// Verify deposit
const verifyDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reference } = req.body;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }

    // Find the transaction
    const transaction = wallet.transactions.find(t => t.reference === reference);
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction already processed'
      });
    }

    // Verify with Paystack
    const paystackConfig = {
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      baseUrl: 'https://api.paystack.co'
    };

    const paystackResponse = await axios.get(
      `${paystackConfig.baseUrl}/transaction/verify/${transaction.externalReference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = paystackResponse.data.data;

    if (paymentData.status === 'success') {
      // Update transaction status
      transaction.status = 'completed';
      
      // Update wallet balance
      wallet.updateBalance(transaction.amount, 'deposit');
      
      await wallet.save();

      res.status(200).json({
        status: 'success',
        message: 'Deposit verified and completed',
        data: {
          transaction: {
            reference: transaction.reference,
            amount: transaction.amount,
            status: transaction.status,
            createdAt: transaction.createdAt
          },
          wallet: {
            balance: wallet.balance,
            currency: wallet.currency
          }
        }
      });
    } else {
      // Mark transaction as failed
      transaction.status = 'failed';
      await wallet.save();

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
    console.error('Error verifying deposit:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify deposit'
    });
  }
};

// Withdraw funds from wallet
const withdrawFunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount'
      });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Bank details are required'
      });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }

    // Check if sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance'
      });
    }

    // Check limits
    const limitCheck = wallet.checkLimits('withdrawal', amount);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        status: 'error',
        message: limitCheck.reason
      });
    }

    // Generate transaction reference
    const reference = generateTransactionReference('withdrawal');

    // Create withdrawal transaction
    const transaction = {
      type: 'withdrawal',
      amount: amount,
      currency: wallet.currency,
      description: `Withdrawal to ${bankDetails.accountNumber}`,
      reference: reference,
      status: 'pending',
      metadata: {
        bankDetails: bankDetails,
        withdrawalMethod: 'bank_transfer'
      },
      createdAt: new Date()
    };

    wallet.addTransaction(transaction);
    await wallet.save();

    // TODO: Integrate with bank transfer service (Paystack Transfer, etc.)
    // For now, we'll mark it as completed after a delay
    setTimeout(async () => {
      try {
        const updatedWallet = await Wallet.findOne({ user: userId });
        const updatedTransaction = updatedWallet.transactions.find(t => t.reference === reference);
        if (updatedTransaction && updatedTransaction.status === 'pending') {
          updatedTransaction.status = 'completed';
          updatedWallet.updateBalance(amount, 'withdrawal');
          await updatedWallet.save();
        }
      } catch (error) {
        console.error('Error processing withdrawal:', error);
      }
    }, 5000); // 5 seconds delay for demo

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction: {
          reference: reference,
          amount: amount,
          status: 'pending',
          createdAt: transaction.createdAt
        },
        estimatedProcessingTime: '24-48 hours'
      }
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process withdrawal'
    });
  }
};

// Transfer funds between users
const transferFunds = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId, amount, description } = req.body;

    // Validation
    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid transfer details. Please provide valid recipient and amount.'
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot transfer to yourself'
      });
    }

    // Validate amount format
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter a valid amount greater than 0'
      });
    }

    // No minimum transfer amount - unlimited transfers

    // Get sender's wallet
    const fromWallet = await Wallet.findOne({ user: fromUserId });
    if (!fromWallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Your wallet not found. Please contact support.'
      });
    }

    // Check if sufficient balance
    if (fromWallet.balance < transferAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient balance. Available: $${fromWallet.balance.toFixed(2)}`
      });
    }

    // Check limits
    const limitCheck = fromWallet.checkLimits('transfer', transferAmount);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        status: 'error',
        message: limitCheck.reason
      });
    }

    // Get or create recipient's wallet
    let toWallet = await Wallet.findOne({ user: toUserId });
    if (!toWallet) {
      toWallet = await Wallet.create({ 
        user: toUserId, 
        balance: 0, 
        currency: fromWallet.currency 
      });
    }

    // Get recipient user details
    const toUser = await User.findById(toUserId).select('firstName lastName email');
    if (!toUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient not found'
      });
    }

    // Generate transaction references
    const transferReference = generateTransactionReference('transfer');
    const fromReference = `${transferReference}_OUT`;
    const toReference = `${transferReference}_IN`;

    // Create transactions
    const fromTransaction = {
      type: 'transfer_out',
      amount: transferAmount,
      currency: fromWallet.currency,
      description: description || `Transfer to ${toUser.firstName} ${toUser.lastName}`,
      reference: fromReference,
      status: 'completed',
      toUser: toUserId,
      metadata: {
        transferReference: transferReference,
        recipientName: `${toUser.firstName} ${toUser.lastName}`,
        recipientEmail: toUser.email
      },
      createdAt: new Date()
    };

    const toTransaction = {
      type: 'transfer_in',
      amount: transferAmount,
      currency: toWallet.currency,
      description: description || `Transfer from ${req.user.firstName} ${req.user.lastName}`,
      reference: toReference,
      status: 'completed',
      fromUser: fromUserId,
      metadata: {
        transferReference: transferReference,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        senderEmail: req.user.email
      },
      createdAt: new Date()
    };

    // Update wallets atomically
    fromWallet.addTransaction(fromTransaction);
    fromWallet.updateBalance(transferAmount, 'transfer_out');
    fromWallet.dailyUsage.transferAmount += transferAmount;

    toWallet.addTransaction(toTransaction);
    toWallet.updateBalance(transferAmount, 'transfer_in');

    await Promise.all([fromWallet.save(), toWallet.save()]);

    res.status(200).json({
      status: 'success',
      message: 'Transfer completed successfully',
      data: {
        transfer: {
          reference: transferReference,
          amount: transferAmount,
          currency: fromWallet.currency,
          fromUser: {
            id: fromUserId,
            name: `${req.user.firstName} ${req.user.lastName}`
          },
          toUser: {
            id: toUserId,
            name: `${toUser.firstName} ${toUser.lastName}`
          },
          description: description,
          createdAt: new Date()
        },
        fromWallet: {
          balance: fromWallet.balance,
          currency: fromWallet.currency
        }
      }
    });

  } catch (error) {
    console.error('Error processing transfer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process transfer. Please try again.'
    });
  }
};

// Get wallet statistics
const getWalletStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Wallet not found'
      });
    }

    // Calculate additional statistics
    const transactions = wallet.transactions;
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === 'completed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;

    // Calculate transaction amounts by type
    const deposits = transactions.filter(t => t.type === 'deposit' && t.status === 'completed');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed');
    const transfersOut = transactions.filter(t => t.type === 'transfer_out' && t.status === 'completed');
    const transfersIn = transactions.filter(t => t.type === 'transfer_in' && t.status === 'completed');

    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const totalTransfersOut = transfersOut.reduce((sum, t) => sum + t.amount, 0);
    const totalTransfersIn = transfersIn.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status
        },
        stats: {
          totalTransactions,
          completedTransactions,
          pendingTransactions,
          failedTransactions,
          totalDeposits,
          totalWithdrawals,
          totalTransfersOut,
          totalTransfersIn,
          netTransferAmount: totalTransfersIn - totalTransfersOut
        },
        limits: wallet.limits,
        usage: {
          daily: wallet.dailyUsage,
          monthly: wallet.monthlyUsage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wallet statistics'
    });
  }
};

module.exports = {
  createWallet,
  getWallet,
  getWalletTransactions,
  depositFunds,
  verifyDeposit,
  withdrawFunds,
  transferFunds,
  getWalletStats,
  handleCardPayment,
  handleBankTransfer,
  handleMobileMoney
};
