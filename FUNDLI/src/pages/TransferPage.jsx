import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowUpDown,
  User,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Users
} from 'lucide-react';
import { refreshWalletAfterTransaction } from '../utils/walletUtils';

const TransferPage = () => {
  const navigate = useNavigate();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wallet, setWallet] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transferData, setTransferData] = useState(null);

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

  const [searchTimeout, setSearchTimeout] = useState(null);

  const searchRecipient = async () => {
    if (!recipientEmail) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      setRecipient(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/users/search?email=${encodeURIComponent(recipientEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Search response:', data);
        if (data.data && data.data.user) {
          console.log('Setting recipient:', data.data.user);
          setRecipient(data.data.user);
          setError(''); // Clear any previous errors
        } else {
          console.log('No user found in response');
          setError('User not found');
        }
      } else {
        console.log('Search failed:', data);
        if (response.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(data.message || 'User not found');
        }
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setError('Failed to search user. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (recipientEmail && recipientEmail.includes('@')) {
        searchRecipient();
      }
    }, 500); // 500ms delay
    
    setSearchTimeout(timeout);
  };

  const handleTransfer = async () => {
    if (!recipient) {
      setError('Please search and select a recipient');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount < 10) {
      setError('Minimum transfer amount is $10');
      return;
    }

    if (wallet && wallet.balance < transferAmount) {
      setError(`Insufficient balance. Available: $${wallet.balance.toFixed(2)}`);
      return;
    }

    // Show confirmation modal
    setTransferData({
      recipient,
      amount: transferAmount,
      description
    });
    setShowConfirmModal(true);
  };

  const confirmTransfer = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      setShowConfirmModal(false);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toUserId: transferData.recipient._id,
          amount: transferData.amount,
          description: transferData.description
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Transfer successful! $${transferData.amount.toFixed(2)} sent to ${transferData.recipient.firstName} ${transferData.recipient.lastName}.`);
        setAmount('');
        setDescription('');
        setRecipient(null);
        setRecipientEmail('');
        setTransferData(null);
        
        // Refresh wallet data
        await loadWalletData();
        
        // Trigger wallet balance update using utility function
        refreshWalletAfterTransaction('transfer', transferData.amount, false);
        
        // Redirect to wallet page after 3 seconds
        setTimeout(() => {
          navigate('/wallet');
        }, 3000);
      } else {
        setError(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Error processing transfer:', error);
      setError('An error occurred while processing your transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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
            <ArrowUpDown className="h-8 w-8 mr-3 text-primary-600" />
            Transfer Funds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Send money to other users instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Transfer Details
              </h2>

              {/* Recipient Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Email
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      setError(''); // Clear errors when typing
                      setRecipient(null); // Clear previous recipient
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchRecipient();
                      }
                    }}
                    placeholder="Enter recipient's email"
                    className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={searchRecipient}
                    disabled={isSearching || !recipientEmail}
                    className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
                  >
                    {isSearching ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {recipientEmail && !recipient && !isSearching && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Press Enter or click search to find the user
                  </p>
                )}
              </div>

              {/* Recipient Info */}
              {recipient && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {recipient.firstName} {recipient.lastName}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {recipient.email}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="block w-full pl-12 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    min="10"
                    step="10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note for this transfer"
                  rows={3}
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
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
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-green-800 dark:text-green-200">{success}</span>
                  </div>
                </motion.div>
              )}

              {/* Debug Info - Only show in development and when needed */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Recipient: {recipient ? 'Found' : 'Not found'}</div>
                    <div>Amount: {amount || 'Empty'}</div>
                    <div>Amount Valid: {amount && parseFloat(amount) >= 10 ? 'Yes' : 'No'}</div>
                    <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="mt-2 text-gray-600 dark:text-gray-400">
                    <strong>Debug:</strong> Enter a valid email address and click search to find users.
                  </div>
                </div>
              )}

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={isLoading || !recipient || !amount || parseFloat(amount) < 10}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing Transfer...
                  </>
                ) : !recipient ? (
                  <>
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Select Recipient First
                  </>
                ) : !amount ? (
                  <>
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Enter Amount
                  </>
                ) : parseFloat(amount) < 10 ? (
                  <>
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Minimum $10 Required
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Transfer {formatAmount(parseFloat(amount) || 0)}
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
                Available Balance
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                ${wallet?.balance?.toLocaleString() || '0.00'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {wallet?.currency || 'USD'}
              </p>
            </motion.div>

            {/* Transfer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Transfer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Transferred Today</span>
                    <span>${wallet?.dailyUsage?.transferAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Unlimited transfers available
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Transfer Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Transfer Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Instant Transfer
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  No Fees
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Secure & Encrypted
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Transaction History
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && transferData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Transfer
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Recipient:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {transferData.recipient.firstName} {transferData.recipient.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {transferData.recipient.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    ${transferData.amount.toFixed(2)}
                  </span>
                </div>
                {transferData.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {transferData.description}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransfer}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Transfer'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferPage;
