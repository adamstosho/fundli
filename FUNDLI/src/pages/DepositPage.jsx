import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Banknote,
  Smartphone,
  Laptop,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

const DepositPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wallet, setWallet] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedItem, setCopiedItem] = useState('');

  // Predefined amounts
  const quickAmounts = [50, 100, 250, 500, 1000, 2500];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWallet(data.data.wallet);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const handleDeposit = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      // Check daily limits
      if (wallet) {
        const dailyUsed = wallet.dailyUsage?.depositAmount || 0;
        const dailyLimit = wallet.limits?.dailyDepositLimit || 1000000;
        
        if (dailyUsed + parseFloat(amount) > dailyLimit) {
          setError(`Amount exceeds daily deposit limit of ₦${dailyLimit.toLocaleString()}`);
          return;
        }
      }

      const token = localStorage.getItem('accessToken');
      console.log('Making deposit request with:', {
        amount: parseFloat(amount),
        currency: currency,
        paymentMethod: paymentMethod
      });
      
      const response = await fetch('http://localhost:5000/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: currency,
          paymentMethod: paymentMethod
        })
      });

      console.log('Deposit response status:', response.status);
      const data = await response.json();
      console.log('Deposit response data:', data);

      if (response.ok) {
        // Handle different payment methods
        switch (paymentMethod) {
          case 'card':
            await handleCardPayment(data.data);
            break;
          case 'bank':
            await handleBankTransfer(data.data);
            break;
          case 'mobile':
            await handleMobileMoney(data.data);
            break;
          default:
            await handleCardPayment(data.data);
        }
      } else {
        console.error('Deposit failed:', data);
        setError(data.message || 'Failed to initialize payment');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      setError('An error occurred while processing your deposit');
      setIsLoading(false);
    }
  };

  const handleCardPayment = async (paymentData) => {
    try {
      console.log('Payment data received:', paymentData);
      
      // Check if this is a simulated payment (development mode)
      if (paymentData.transaction && paymentData.transaction.metadata?.simulated) {
        // Handle simulated payment
        setSuccess(`Deposit successful! $${parseFloat(amount).toLocaleString()} has been added to your wallet.`);
        setIsLoading(false);
        
        // Refresh wallet data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      // Handle real Paystack payment
      const { authorizationUrl, publicKey, reference } = paymentData;
      
      console.log('Paystack public key:', publicKey);
      console.log('Window.PaystackPop available:', typeof window.PaystackPop);
      
      // Wait for Paystack to load if not immediately available
      let attempts = 0;
      const maxAttempts = 10;
      
      while (typeof window.PaystackPop === 'undefined' && attempts < maxAttempts) {
        console.log(`Waiting for Paystack to load... attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Check if Paystack is available after waiting
      if (typeof window.PaystackPop === 'undefined') {
        console.error('Paystack failed to load after waiting');
        setError('Payment service is not available. Please refresh the page and try again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Paystack loaded successfully, initializing payment...');
      
      // Open Paystack popup for card payment
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: paymentData.user?.email || 'user@example.com',
        amount: parseFloat(amount) * 100, // Convert to kobo
        currency: currency,
        ref: reference,
        callback: function(response) {
          console.log('Payment callback received:', response);
          handlePaymentCallback(response, reference);
        },
        onClose: function() {
          console.log('Payment popup closed');
          setIsLoading(false);
          setError('Payment was cancelled');
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error('Error with card payment:', error);
      setError(`Failed to initialize card payment: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleBankTransfer = async (paymentData) => {
    try {
      // Check if this is a simulated payment (development mode)
      if (paymentData.transaction && paymentData.transaction.metadata?.simulated) {
        // Handle simulated bank transfer
        setSuccess(`Bank transfer successful! $${parseFloat(amount).toLocaleString()} has been added to your wallet.`);
        setIsLoading(false);
        
        // Refresh wallet data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      // For real bank transfer, show account details
      const bankDetails = paymentData.bankDetails || {
        accountNumber: '1234567890',
        accountName: 'FUNDLI WALLET',
        bankName: 'Access Bank',
        amount: parseFloat(amount),
        reference: paymentData.reference
      };

      setSuccess(`Bank Transfer Details:
Account Number: ${bankDetails.accountNumber}
Account Name: ${bankDetails.accountName}
Bank: ${bankDetails.bankName}
Amount: $${bankDetails.amount.toLocaleString()}
Reference: ${bankDetails.reference}

Please transfer the exact amount and use the reference number. Your wallet will be credited within 24 hours after confirmation.`);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error with bank transfer:', error);
      setError('Failed to process bank transfer');
      setIsLoading(false);
    }
  };

  const handleMobileMoney = async (paymentData) => {
    try {
      // For mobile money, show payment instructions
      const mobileDetails = {
        provider: 'MTN Mobile Money',
        number: '08012345678',
        amount: parseFloat(amount),
        reference: paymentData.reference
      };

      setSuccess(`Mobile Money Payment:
Provider: ${mobileDetails.provider}
Number: ${mobileDetails.number}
Amount: ₦${mobileDetails.amount.toLocaleString()}
Reference: ${mobileDetails.reference}

Send the exact amount to the number above and include the reference. Your wallet will be credited within 2 hours after confirmation.`);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error with mobile money:', error);
      setError('Failed to process mobile money payment');
      setIsLoading(false);
    }
  };

  const handlePaymentCallback = async (response, reference) => {
    try {
      setIsVerifying(true);
      
      const token = localStorage.getItem('accessToken');
      const verifyResponse = await fetch('http://localhost:5000/api/wallet/verify-deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference: reference
        })
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok) {
        setSuccess(`Deposit successful! ₦${amount} has been added to your wallet.`);
        setAmount('');
        
        // Refresh wallet data
        await loadWalletData();
        
        // Redirect to wallet page after 3 seconds
        setTimeout(() => {
          navigate('/wallet');
        }, 3000);
      } else {
        setError(verifyData.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Failed to verify payment');
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const copyToClipboard = async (text, item) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <CreditCard className="h-8 w-8 mr-3 text-primary-600" />
            Deposit Funds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add funds to your wallet using secure payment methods
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deposit Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Deposit Amount
              </h2>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="block w-full pl-12 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="100"
                    step="100"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quick Amounts
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                        amount === quickAmount.toString()
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                      }`}
                    >
                      ₦{quickAmount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="GHS">Ghanaian Cedi (GHS)</option>
                  <option value="ZAR">South African Rand (ZAR)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border transition-colors ${
                      paymentMethod === 'card'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Card Payment</div>
                    <div className="text-xs opacity-75 mt-1">Instant</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 rounded-lg border transition-colors ${
                      paymentMethod === 'bank'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                    }`}
                  >
                    <Banknote className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Bank Transfer</div>
                    <div className="text-xs opacity-75 mt-1">24 hours</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`p-4 rounded-lg border transition-colors ${
                      paymentMethod === 'mobile'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                    }`}
                  >
                    <Smartphone className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Mobile Money</div>
                    <div className="text-xs opacity-75 mt-1">2 hours</div>
                  </button>
                </div>
                
                {/* Payment Method Info */}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {paymentMethod === 'card' && (
                      <>💳 <strong>Card Payment:</strong> Secure payment via Paystack. Supports Visa, Mastercard, and American Express.</>
                    )}
                    {paymentMethod === 'bank' && (
                      <>🏦 <strong>Bank Transfer:</strong> Transfer directly from your bank account. Processing time: 24 hours.</>
                    )}
                    {paymentMethod === 'mobile' && (
                      <>📱 <strong>Mobile Money:</strong> Send money via mobile wallet. Processing time: 2 hours.</>
                    )}
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-red-800 dark:text-red-200">{error}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-green-800 dark:text-green-200 whitespace-pre-line">
                        {success}
                      </div>
                      {success.includes('Account Number') && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm font-medium">Account Number:</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono">1234567890</span>
                              <button
                                onClick={() => copyToClipboard('1234567890', 'account')}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                {copiedItem === 'account' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm font-medium">Reference:</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono">{success.match(/Reference: ([A-Z0-9_]+)/)?.[1] || 'N/A'}</span>
                              <button
                                onClick={() => copyToClipboard(success.match(/Reference: ([A-Z0-9_]+)/)?.[1] || '', 'reference')}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                {copiedItem === 'reference' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {success.includes('Number:') && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm font-medium">Mobile Number:</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono">08012345678</span>
                              <button
                                onClick={() => copyToClipboard('08012345678', 'mobile')}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                {copiedItem === 'mobile' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Deposit Button */}
              <button
                onClick={handleDeposit}
                disabled={isLoading || isVerifying || !amount}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isVerifying ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-pulse" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Deposit {formatAmount(parseFloat(amount) || 0)}
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Balance
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                ₦{wallet?.balance?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {wallet?.currency || 'NGN'}
              </p>
            </motion.div>

            {/* Deposit Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Deposit Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Deposited Today</span>
                    <span>₦{wallet?.dailyUsage?.depositAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Deposited This Month</span>
                    <span>₦{wallet?.monthlyUsage?.depositAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Unlimited deposits available
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Security Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Security Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  SSL Encryption
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  PCI DSS Compliant
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Fraud Protection
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Real-time Verification
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
