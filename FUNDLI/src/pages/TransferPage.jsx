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
  Users,
  XCircle,
  ArrowRight
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
  const [approvedBorrowers, setApprovedBorrowers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseFilter, setBrowseFilter] = useState('');
  const [showLoanSelectionModal, setShowLoanSelectionModal] = useState(false);
  const [selectedBorrowerForLoanSelection, setSelectedBorrowerForLoanSelection] = useState(null);

  useEffect(() => {
    loadWalletData();
    loadApprovedBorrowers();
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

  const loadApprovedBorrowers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Loading approved borrowers...');
      const response = await fetch('http://localhost:5000/api/wallet/approved-borrowers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Approved borrowers loaded:', data.data.borrowers?.length || 0);
        setApprovedBorrowers(data.data.borrowers || []);
      } else {
        console.error('Failed to load approved borrowers:', response.status);
      }
    } catch (error) {
      console.error('Error loading approved borrowers:', error);
    }
  };

  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleEmailInputChange = (e) => {
    const value = e.target.value;
    setRecipientEmail(value);
    setRecipient(null);
    setError('');

    if (value.length > 0) {
      // Filter approved borrowers based on email input
      const filtered = approvedBorrowers.filter(borrower => 
        borrower.email.toLowerCase().includes(value.toLowerCase()) ||
        borrower.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  const selectSuggestion = (borrower) => {
    console.log('Selected borrower from suggestions:', borrower);
    setRecipientEmail(borrower.email);
    setRecipient(borrower);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    setError('');
  };

  const handleEmailInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const openBrowseModal = () => {
    console.log('Opening browse modal, approvedBorrowers count:', approvedBorrowers.length);
    setShowBrowseModal(true);
    setBrowseFilter('');
  };

  const closeBrowseModal = () => {
    setShowBrowseModal(false);
    setBrowseFilter('');
  };

  const selectBorrowerFromBrowse = (borrower) => {
    console.log('Selected borrower from browse:', borrower);
    
    // Check if borrower has multiple approved loans
    if (borrower.approvedLoans && borrower.approvedLoans.length > 1) {
      // Show loan selection modal
      setSelectedBorrowerForLoanSelection(borrower);
      setShowLoanSelectionModal(true);
      closeBrowseModal();
    } else {
      // Single loan or no loans - proceed directly
      setRecipientEmail(borrower.email);
      setRecipient(borrower);
      closeBrowseModal();
      setError('');
    }
  };

  const filteredBrowseBorrowers = approvedBorrowers.filter(borrower => 
    borrower.email.toLowerCase().includes(browseFilter.toLowerCase()) ||
    borrower.name.toLowerCase().includes(browseFilter.toLowerCase())
  );

  const closeLoanSelectionModal = () => {
    setShowLoanSelectionModal(false);
    setSelectedBorrowerForLoanSelection(null);
  };

  const selectLoanForTransfer = (borrower, selectedLoan) => {
    console.log('Selected loan for transfer:', selectedLoan);
    
    // Create borrower object with selected loan info
    const borrowerWithSelectedLoan = {
      ...borrower,
      selectedLoan: selectedLoan
    };
    
    setRecipientEmail(borrower.email);
    setRecipient(borrowerWithSelectedLoan);
    closeLoanSelectionModal();
    setError('');
  };

  const searchRecipient = async () => {
    if (!recipientEmail) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+₦/;
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
      setError('Minimum transfer amount is ₦10');
      return;
    }

    if (wallet && wallet.balance < transferAmount) {
      setError(`Insufficient balance. Available: ₦${wallet.balance.toFixed(2)}`);
      return;
    }

    // Show confirmation modal
    setTransferData({
      recipient,
      amount: transferAmount,
      description,
      selectedLoan: recipient?.selectedLoan || null
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
      
      // Debug: Log the transfer data being sent
      console.log('Transfer data:', {
        toUserId: transferData.recipient.id || transferData.recipient._id,
        amount: transferData.amount,
        description: transferData.description,
        recipient: transferData.recipient
      });
      
      const response = await fetch('http://localhost:5000/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toUserId: transferData.recipient.id || transferData.recipient._id,
          amount: transferData.amount,
          description: transferData.description,
          loanId: transferData.selectedLoan?.loanId || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Transfer successful! ₦${transferData.amount.toFixed(2)} sent to ${transferData.recipient.firstName} ${transferData.recipient.lastName}.`);
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
        console.error('Transfer failed:', data);
        setError(data.message || data.status || 'Transfer failed');
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
    <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center">
            <ArrowUpDown className="h-8 w-8 mr-3 text-primary-600" />
            Transfer Funds
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Send money to other users instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-6">
                Transfer Details
              </h2>

              {/* Recipient Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Recipient Email
                </label>
                <div className="relative">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={handleEmailInputChange}
                      onBlur={handleEmailInputBlur}
                      onFocus={() => {
                        if (filteredSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchRecipient();
                        }
                      }}
                      placeholder="Enter recipient's email"
                      className="flex-1 px-3 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    />
                    <button
                      onClick={searchRecipient}
                      disabled={isSearching || !recipientEmail}
                      className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
                    >
                      {isSearching ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={openBrowseModal}
                      className="px-4 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors flex items-center"
                      title={`Browse all approved borrowers (${approvedBorrowers.length} available)`}
                    >
                      <Users className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Email Suggestions Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-secondary-800 border border-neutral-200 dark:border-secondary-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 px-2">
                          Approved Borrowers ({filteredSuggestions.length})
                        </div>
                        {filteredSuggestions.map((borrower) => (
                          <div
                            key={borrower.id}
                            onClick={() => selectSuggestion(borrower)}
                            className="flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-secondary-700 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-secondary-900 dark:text-white">
                                {borrower.name}
                              </div>
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                {borrower.email}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                {borrower.approvedLoans.length} approved loan{borrower.approvedLoans.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="ml-3">
                              <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {recipientEmail && !recipient && !isSearching && !showSuggestions && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                    Press Enter or click search to find the user
                  </p>
                )}
                {approvedBorrowers.length > 0 && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    <p>💡 Start typing to see approved borrowers ({approvedBorrowers.length} available)</p>
                    <p>👥 Click the users icon to browse all approved borrowers</p>
                  </div>
                )}
              </div>

              {/* Recipient Info */}
              {recipient && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg"
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-success dark:text-success/50 mr-3" />
                    <div>
                      <div className="font-medium text-success dark:text-success/30">
                        {recipient.firstName} {recipient.lastName}
                      </div>
                      <div className="text-sm text-success dark:text-success/50">
                        {recipient.email}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 dark:text-neutral-400 text-sm">₦</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="block w-full pl-12 pr-3 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    min="10"
                    step="10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note for this transfer"
                  rows={3}
                  className="block w-full px-3 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-2" />
                    <span className="text-error dark:text-error/30">{error}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg"
                >
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success dark:text-success/50 mr-2" />
                    <span className="text-success dark:text-success/30">{success}</span>
                  </div>
                </motion.div>
              )}

              {/* Debug Info - Only show in development and when needed */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Recipient: {recipient ? 'Found' : 'Not found'}</div>
                    <div>Amount: {amount || 'Empty'}</div>
                    <div>Amount Valid: {amount && parseFloat(amount) >= 10 ? 'Yes' : 'No'}</div>
                    <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="mt-2 text-neutral-600 dark:text-neutral-400">
                    <strong>Debug:</strong> Enter a valid email address and click search to find users.
                  </div>
                </div>
              )}

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={isLoading || !recipient || !amount || parseFloat(amount) < 10}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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
                    Minimum ₦10 Required
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
              className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Available Balance
              </h3>
              <div className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                ₦${wallet?.balance?.toLocaleString() || '0.00'}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {wallet?.currency || 'USD'}
              </p>
            </motion.div>

            {/* Transfer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Transfer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    <span>Transferred Today</span>
                    <span>₦${wallet?.dailyUsage?.transferAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                <div className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg p-3">
                  <p className="text-sm text-success dark:text-success/30">
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
              className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary-600" />
                Transfer Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Instant Transfer
                </div>
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  No Fees
                </div>
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Secure & Encrypted
                </div>
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
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
              className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Confirm Transfer
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Recipient:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {transferData.recipient.firstName} {transferData.recipient.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Email:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {transferData.recipient.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Amount:</span>
                  <span className="font-bold text-lg text-secondary-900 dark:text-white">
                    ${transferData.amount.toFixed(2)}
                  </span>
                </div>
                {transferData.description && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Description:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {transferData.description}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransfer}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
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

        {/* Browse All Borrowers Modal */}
        {showBrowseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-secondary-700">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    Browse Approved Borrowers
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Select a borrower to transfer money to ({approvedBorrowers.length} available)
                    {approvedBorrowers.length === 0 && ' - No approved borrowers found'}
                  </p>
                </div>
                <button
                  onClick={closeBrowseModal}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Search Filter */}
              <div className="p-6 border-b border-neutral-200 dark:border-secondary-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    value={browseFilter}
                    onChange={(e) => setBrowseFilter(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                  />
                </div>
                {browseFilter && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                    Showing {filteredBrowseBorrowers.length} of {approvedBorrowers.length} borrowers
                  </p>
                )}
              </div>

              {/* Borrowers List */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredBrowseBorrowers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBrowseBorrowers.map((borrower) => (
                      <div
                        key={borrower.id}
                        onClick={() => selectBorrowerFromBrowse(borrower)}
                        className="p-4 border border-neutral-200 dark:border-secondary-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-secondary-700 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {borrower.name}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {borrower.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4 text-success" />
                                <span>{borrower.approvedLoans.length} approved loan{borrower.approvedLoans.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {/* Loan Details */}
                            {borrower.approvedLoans.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {borrower.approvedLoans.slice(0, 2).map((loan, index) => (
                                  <div key={index} className="text-xs text-neutral-500 dark:text-neutral-400">
                                    • ${loan.amount.toLocaleString()} - {loan.purpose} ({loan.status})
                                  </div>
                                ))}
                                {borrower.approvedLoans.length > 2 && (
                                  <div className="text-xs text-neutral-400 dark:text-neutral-500">
                                    +{borrower.approvedLoans.length - 2} more loan{borrower.approvedLoans.length - 2 !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                      {browseFilter ? 'No borrowers found' : 'No approved borrowers'}
                    </h4>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      {browseFilter 
                        ? `No borrowers match "${browseFilter}"`
                        : 'There are currently no approved borrowers available for transfer.'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-200 dark:border-secondary-700">
                <button
                  onClick={closeBrowseModal}
                  className="w-full px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Loan Selection Modal */}
        {showLoanSelectionModal && selectedBorrowerForLoanSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-secondary-700">
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    Select Loan to Fund
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {selectedBorrowerForLoanSelection.name} has {selectedBorrowerForLoanSelection.approvedLoans.length} approved loan{selectedBorrowerForLoanSelection.approvedLoans.length !== 1 ? 's' : ''} waiting for funding
                  </p>
                </div>
                <button
                  onClick={closeLoanSelectionModal}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Borrower Info */}
              <div className="p-6 border-b border-neutral-200 dark:border-secondary-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-white">
                      {selectedBorrowerForLoanSelection.name}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {selectedBorrowerForLoanSelection.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loans List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {selectedBorrowerForLoanSelection.approvedLoans.map((loan, index) => (
                    <div
                      key={loan.loanId}
                      onClick={() => selectLoanForTransfer(selectedBorrowerForLoanSelection, loan)}
                      className="p-4 border border-neutral-200 dark:border-secondary-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-secondary-700 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-success" />
                            </div>
                            <div>
                              <h5 className="font-medium text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                ${loan.amount.toLocaleString()} - {loan.purpose}
                              </h5>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Status: {loan.status}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Applied: {new Date(loan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-200 dark:border-secondary-700">
                <button
                  onClick={closeLoanSelectionModal}
                  className="w-full px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Cancel
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
