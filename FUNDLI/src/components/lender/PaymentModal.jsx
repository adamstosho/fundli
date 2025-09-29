import { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  User,
  Calendar,
  TrendingUp,
  Shield,
  X,
  ArrowRight,
  Loader
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PaymentModal = ({ isOpen, onClose, loanApplication, onPaymentSuccess }) => {
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    notes: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  useEffect(() => {
    if (isOpen && loanApplication) {
      setPaymentData(prev => ({
        ...prev,
        amount: loanApplication.loanAmount?.toString() || ''
      }));
      loadWalletBalance();
    }
  }, [isOpen, loanApplication]);

  const loadWalletBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const token = localStorage.getItem('accessToken');
      
      // Get user info to verify this is a lender
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      console.log('PaymentModal - Loading wallet balance for user type:', userInfo.userType);
      
      // Try backend first
      try {
        const response = await fetch(buildApiUrl('/lender/wallet/balance'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('PaymentModal - Backend wallet balance response:', result);
          setWalletBalance(result.data.balance || 0);
          return; // Success, exit early
        }
      } catch (backendError) {
        console.log('PaymentModal - Backend wallet API not available, using local storage');
      }
      
      // Fallback to local storage
      const localWallet = getLocalWallet('lender');
      console.log('PaymentModal - Local wallet balance:', localWallet.balance);
      setWalletBalance(localWallet.balance);
      
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getLocalWallet = (userType) => {
    try {
      const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
      
      if (!localWallets[userType]) {
        // Create default wallet for this user type
        const defaultWallet = {
          balance: 0, // All user types start with 0 balance
          currency: 'USD',
          status: 'active',
          userType: userType,
          createdAt: new Date().toISOString()
        };
        
        localWallets[userType] = defaultWallet;
        localStorage.setItem('localWallets', JSON.stringify(localWallets));
        
        console.log(`PaymentModal - Created local wallet for ${userType}:`, defaultWallet);
        return defaultWallet;
      }
      
      console.log(`PaymentModal - Loaded local wallet for ${userType}:`, localWallets[userType]);
      return localWallets[userType];
    } catch (error) {
      console.error('Error getting local wallet:', error);
      return {
        balance: 0,
        currency: 'USD',
        status: 'active',
        userType: userType
      };
    }
  };

  const updateLocalWallet = (userType, newBalance) => {
    try {
      const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
      
      if (localWallets[userType]) {
        localWallets[userType].balance = newBalance;
        localWallets[userType].updatedAt = new Date().toISOString();
        localStorage.setItem('localWallets', JSON.stringify(localWallets));
        
        console.log(`PaymentModal - Updated local wallet for ${userType} to:`, newBalance);
      }
    } catch (error) {
      console.error('Error updating local wallet:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validatePayment = () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    const paymentAmount = parseFloat(paymentData.amount);
    const loanAmount = loanApplication.loanAmount;

    // Check if payment amount exceeds loan amount
    if (paymentAmount > loanAmount) {
      setError(`Payment amount cannot exceed the loan amount of ₦${loanAmount.toLocaleString()}`);
      return false;
    }

    // Check if lender has sufficient balance
    if (paymentAmount > walletBalance) {
      setError(`Insufficient balance. You have ₦${walletBalance.toLocaleString()} available, but trying to fund ₦${paymentAmount.toLocaleString()}`);
      return false;
    }

    // Check if wallet balance is 0 or negative
    if (walletBalance <= 0) {
      setError('Your wallet balance is insufficient. Please add funds to your wallet before funding loans.');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    try {
      setIsProcessing(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      const fundingAmount = parseFloat(paymentData.amount);
      
      // Step 1: Process the loan investment
      const fundingResponse = await fetch(buildApiUrl(`/lender/loan/${loanApplication.id}/invest`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          investmentAmount: fundingAmount,
          notes: paymentData.notes
        })
      });

      if (fundingResponse.ok) {
        const fundingResult = await fundingResponse.json();
        
        console.log('✅ Loan funded successfully:', fundingResult);
        
        // Update local wallet balance from response
        if (fundingResult.data?.lenderWallet?.balance !== undefined) {
          const newBalance = fundingResult.data.lenderWallet.balance;
          setWalletBalance(newBalance);
          
          // Update local storage wallet
          updateLocalWallet('lender', newBalance);
          
          console.log('Updated wallet balance from response:', newBalance);
        } else {
          // Fallback to manual calculation
          const newBalance = walletBalance - fundingAmount;
          setWalletBalance(newBalance);
          updateLocalWallet('lender', newBalance);
        }
        
        // Update user info in localStorage with new wallet balance
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.walletBalance = fundingResult.data?.lenderWallet?.balance || (walletBalance - fundingAmount);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // Trigger wallet balance update events for this user only
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated', { 
          detail: { userId: user.id, userType: 'lender', newBalance: fundingResult.data?.lenderWallet?.balance || (walletBalance - fundingAmount) } 
        }));
        
        // Trigger dashboard refresh
        if (window.refreshLenderDashboard) {
          window.refreshLenderDashboard();
        }
        
        // Trigger wallet balance refresh (only for lenders)
        if (window.refreshWalletBalance && user?.userType === 'lender') {
          window.refreshWalletBalance();
        }
        
        // Create notifications
        await createNotifications(fundingResult.data);
        
        setSuccess(true);
        
        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(fundingResult.data);
        }
          
          // Close modal after delay
          setTimeout(() => {
            onClose();
            setSuccess(false);
            setPaymentData({
              amount: '',
              paymentMethod: 'bank_transfer',
              notes: ''
            });
          }, 2000);
        
      } else {
        const errorData = await fundingResponse.json();
        setError(errorData.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const rollbackLoanFunding = async (loanId, amount) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(buildApiUrl(`/lender/loan/${loanId}/rollback`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          reason: 'Wallet transfer failed'
        })
      });
    } catch (error) {
      console.error('Error rolling back loan funding:', error);
    }
  };

  const createNotifications = async (paymentData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const fundingAmount = parseFloat(paymentData.amount || paymentData.fundingAmount);
      
      // Create notification for borrower
      const borrowerNotification = {
        userId: loanApplication.borrower.id,
        type: 'loan_funded',
        title: 'Loan Funded Successfully!',
        message: `Your loan application for ₦${fundingAmount.toLocaleString()} has been funded and the amount has been added to your account balance. Your new balance is ₦${paymentData.borrowerNewBalance?.toLocaleString() || 'updated'}.`,
        metadata: {
          loanId: loanApplication.id,
          amount: fundingAmount,
          lenderName: 'Lender', // You can get this from user context
          transactionId: paymentData.transactionId,
          transferId: paymentData.transferId,
          borrowerBalance: paymentData.borrowerNewBalance,
          lenderBalance: paymentData.lenderNewBalance,
          purpose: loanApplication.purpose,
          fundedAt: new Date().toISOString()
        }
      };

      // Create notification for admin
      const adminNotification = {
        userId: 'admin', // You might need to get admin ID from context
        type: 'loan_funded',
        title: 'Loan Funding Completed',
        message: `A loan application for ₦${fundingAmount.toLocaleString()} has been funded by a lender. Wallet transfer completed successfully.`,
        metadata: {
          loanId: loanApplication.id,
          amount: fundingAmount,
          lenderName: 'Lender',
          borrowerName: loanApplication.borrower.name,
          transactionId: paymentData.transactionId,
          transferId: paymentData.transferId,
          borrowerBalance: paymentData.borrowerNewBalance,
          lenderBalance: paymentData.lenderNewBalance,
          purpose: loanApplication.purpose,
          fundedAt: new Date().toISOString()
        }
      };

      // Update borrower's local wallet balance
      const borrowerWallet = getLocalWallet('borrower');
      const borrowerNewBalance = borrowerWallet.balance + fundingAmount;
      updateLocalWallet('borrower', borrowerNewBalance);
      
      // Update notification with actual balance
      borrowerNotification.message = `Your loan application for ₦${fundingAmount.toLocaleString()} has been funded and the amount has been added to your account balance. Your new balance is ₦${borrowerNewBalance.toLocaleString()}.`;
      borrowerNotification.metadata.borrowerBalance = borrowerNewBalance;

      // Try to send notifications to backend, but don't fail if it doesn't work
      try {
        // Send borrower notification
        const borrowerResponse = await fetch(buildApiUrl('/notifications/create'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(borrowerNotification)
        });

        if (!borrowerResponse.ok) {
          console.log('Backend notification API not available, storing locally');
          // Store in localStorage as fallback
          storeNotificationLocally(borrowerNotification);
        }

        // Send admin notification
        const adminResponse = await fetch(buildApiUrl('/notifications/create'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(adminNotification)
        });

        if (!adminResponse.ok) {
          console.log('Backend notification API not available, storing locally');
          // Store in localStorage as fallback
          storeNotificationLocally(adminNotification);
        }

      } catch (apiError) {
        console.log('Backend notification API not available, storing locally');
        // Store notifications locally as fallback
        storeNotificationLocally(borrowerNotification);
        storeNotificationLocally(adminNotification);
      }

    } catch (error) {
      console.error('Error creating notifications:', error);
      // Don't fail the payment if notifications fail
    }
  };

  const storeNotificationLocally = (notification) => {
    try {
      const existingNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const newNotification = {
        ...notification,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      existingNotifications.unshift(newNotification);
      
      // Keep only last 50 notifications
      if (existingNotifications.length > 50) {
        existingNotifications.splice(50);
      }
      
      localStorage.setItem('localNotifications', JSON.stringify(existingNotifications));
      
      // Trigger a custom event to notify the notification dropdown
      window.dispatchEvent(new CustomEvent('notificationAdded', { 
        detail: newNotification 
      }));
      
    } catch (error) {
      console.error('Error storing notification locally:', error);
    }
  };

  if (!isOpen || !loanApplication) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-secondary-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/20 dark:bg-success/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success dark:text-success/50" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                Fund Loan Application
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Complete the funding process for this loan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-success/20 dark:bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success dark:text-success/50" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              Payment Successful!
            </h4>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              The loan has been funded successfully. The borrower will be notified.
            </p>
            <div className="bg-success/10 dark:bg-success/20 rounded-lg p-4">
              <p className="text-sm text-success dark:text-success/30">
                <strong>Amount Funded:</strong> ${parseFloat(paymentData.amount).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ) : (
          /* Payment Form */
          <div className="space-y-6">
            {/* Loan Details */}
            <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
              <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">Loan Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Borrower:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {loanApplication.borrower?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Amount:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    ${loanApplication.loanAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {loanApplication.duration} months
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Purpose:</span>
                  <span className="font-medium text-secondary-900 dark:text-white capitalize">
                    {loanApplication.purpose}
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className={`rounded-lg p-4 ${
              walletBalance <= 0 
                ? 'bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error' 
                : walletBalance < parseFloat(paymentData.amount || 0)
                ? 'bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning'
                : 'bg-primary-50 dark:bg-primary-900/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className={`h-5 w-5 ${
                    walletBalance <= 0 
                      ? 'text-error dark:text-error/50' 
                      : walletBalance < parseFloat(paymentData.amount || 0)
                      ? 'text-warning dark:text-warning/50'
                      : 'text-primary-600 dark:text-primary-400'
                  }`} />
                  <span className={`font-medium ${
                    walletBalance <= 0 
                      ? 'text-error dark:text-error/30' 
                      : walletBalance < parseFloat(paymentData.amount || 0)
                      ? 'text-warning dark:text-warning/30'
                      : 'text-primary-900 dark:text-primary-200'
                  }`}>
                    Available Balance
                  </span>
                </div>
                {isLoadingBalance ? (
                  <Loader className="h-4 w-4 animate-spin text-primary-600" />
                ) : (
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      walletBalance <= 0 
                        ? 'text-error dark:text-error/30' 
                        : walletBalance < parseFloat(paymentData.amount || 0)
                        ? 'text-warning dark:text-warning/30'
                        : 'text-primary-900 dark:text-primary-200'
                    }`}>
                      ${walletBalance.toLocaleString()}
                    </span>
                    {walletBalance <= 0 && (
                      <p className="text-xs text-error dark:text-error/40 mt-1">
                        Insufficient funds
                      </p>
                    )}
                    {walletBalance > 0 && walletBalance < parseFloat(paymentData.amount || 0) && (
                      <p className="text-xs text-warning dark:text-warning/40 mt-1">
                        Insufficient for this payment
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Funding Amount (₦) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={paymentData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount to fund"
                  min="1"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Loan amount: ${loanApplication.loanAmount?.toLocaleString()}
                </p>
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="wallet">Wallet Balance</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={paymentData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any notes about this funding..."
                  rows="3"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg p-4"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-error dark:text-error/50" />
                  <span className="text-error dark:text-error/30 text-sm">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg p-4"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-success dark:text-success/50" />
                  <div>
                    <h4 className="font-semibold text-success dark:text-success/30">
                      Payment Successful!
                    </h4>
                    <p className="text-sm text-success dark:text-success/40 mt-1">
                      Loan funded successfully. Amount deducted from your wallet and added to borrower's account.
                    </p>
                    <div className="mt-2 text-xs text-success dark:text-success/50">
                      <p>• Your new balance: ${(walletBalance - parseFloat(paymentData.amount)).toLocaleString()}</p>
                      <p>• Borrower's balance updated</p>
                      <p>• Transaction recorded</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Notice */}
            <div className="bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-warning dark:text-warning/50 mt-0.5" />
                <div>
                  <h5 className="font-medium text-warning dark:text-warning/30 text-sm">
                    Security Notice
                  </h5>
                  <p className="text-warning dark:text-warning/40 text-xs mt-1">
                    This transaction is secured and will be processed immediately. The borrower will receive the funds in their account balance.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing || !paymentData.amount || parseFloat(paymentData.amount) <= 0}
                className="flex-1 px-6 py-3 bg-success hover:bg-success disabled:bg-success/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Fund Loan</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentModal;
