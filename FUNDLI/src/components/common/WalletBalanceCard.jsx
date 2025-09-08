import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown,
  Plus,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WalletBalanceCard = ({ userType = 'user' }) => {
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please login to access wallet');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWallet(data.data.wallet);
      } else if (response.status === 404) {
        // If wallet doesn't exist, create one
        const createResponse = await fetch('http://localhost:5000/api/wallet/create', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          setWallet(createData.data.wallet);
        } else {
          const errorData = await createResponse.json();
          setError(errorData.message || 'Failed to create wallet');
        }
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load wallet data');
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check your connection.');
      } else {
        setError('Failed to load wallet data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletClick = () => {
    navigate('/wallet');
  };

  const getQuickActions = () => {
    const actions = [
      {
        label: 'Deposit',
        icon: <Plus className="h-4 w-4" />,
        color: 'bg-green-600 hover:bg-green-700',
        onClick: () => navigate('/deposit')
      },
      {
        label: 'Transfer',
        icon: <ArrowUpDown className="h-4 w-4" />,
        color: 'bg-blue-600 hover:bg-blue-700',
        onClick: () => navigate('/transfer')
      }
    ];

    return actions;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-red-200 dark:border-red-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wallet Balance
          </h3>
          <WalletIcon className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={loadWalletData}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleWalletClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Wallet Balance
        </h3>
        <div className="flex items-center space-x-2">
          <WalletIcon className="h-6 w-6 text-primary-600" />
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          ₦{wallet?.balance?.toLocaleString() || '0'}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {wallet?.currency || 'NGN'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            wallet?.status === 'active' 
              ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
              : 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {wallet?.status || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        {getQuickActions().map((action, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className={`flex items-center space-x-1 px-3 py-1 ${action.color} text-white rounded text-sm transition-colors`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Usage Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Daily Limit</span>
          <span>₦{wallet?.limits?.dailyDepositLimit?.toLocaleString() || '0'}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span>Used Today</span>
          <span>₦{wallet?.dailyUsage?.depositAmount?.toLocaleString() || '0'}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-2">
          <div
            className="bg-primary-600 h-1 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(
                ((wallet?.dailyUsage?.depositAmount || 0) / (wallet?.limits?.dailyDepositLimit || 1)) * 100,
                100
              )}%`
            }}
          ></div>
        </div>
      </div>

      {/* Click to view full wallet */}
      <div className="mt-3 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Click to view full wallet
        </span>
      </div>
    </motion.div>
  );
};

export default WalletBalanceCard;
