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

  const searchRecipient = async () => {
    if (!recipientEmail) return;

    try {
      setIsSearching(true);
      setError('');
      setRecipient(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/users/search?email=${recipientEmail}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.user) {
          setRecipient(data.data.user);
        } else {
          setError('User not found');
        }
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setError('Failed to search user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfer = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!recipient) {
        setError('Please search and select a recipient');
        return;
      }

      if (!amount || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (wallet && wallet.balance < parseFloat(amount)) {
        setError('Insufficient balance');
        return;
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toUserId: recipient._id,
          amount: parseFloat(amount),
          description: description
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Transfer successful! ₦${amount} sent to ${recipient.firstName} ${recipient.lastName}.`);
        setAmount('');
        setDescription('');
        setRecipient(null);
        setRecipientEmail('');
        
        // Refresh wallet data
        await loadWalletData();
        
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
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
                    onChange={(e) => setRecipientEmail(e.target.value)}
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
                    <span className="text-gray-500 dark:text-gray-400 text-sm">₦</span>
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

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={isLoading || !recipient || !amount}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing Transfer...
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
                ₦{wallet?.balance?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {wallet?.currency || 'NGN'}
              </p>
            </motion.div>

            {/* Transfer Limits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Transfer Limits
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Daily Limit</span>
                    <span>₦{wallet?.limits?.dailyTransferLimit?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((wallet?.dailyUsage?.transferAmount || 0) / (wallet?.limits?.dailyTransferLimit || 1)) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Used Today</span>
                    <span>₦{wallet?.dailyUsage?.transferAmount?.toLocaleString() || '0'}</span>
                  </div>
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
      </div>
    </div>
  );
};

export default TransferPage;
