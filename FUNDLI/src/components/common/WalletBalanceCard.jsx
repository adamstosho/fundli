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
    
    // Listen for wallet balance updates
    const handleWalletUpdate = () => {
      loadWalletData();
    };
    
    window.addEventListener('walletBalanceUpdated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('walletBalanceUpdated', handleWalletUpdate);
    };
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

      // Get user info from localStorage to determine user type
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const currentUserType = userInfo.userType || userType;
      
      console.log('Loading wallet for user type:', currentUserType);
      
      // Try backend first, fallback to local storage
      try {
        // Use user-type-specific API endpoints
        let apiEndpoint = 'http://localhost:5000/api/wallet';
        
        // Use specific endpoints based on user type
        if (currentUserType === 'lender') {
          apiEndpoint = 'http://localhost:5000/api/lender/wallet/balance';
        } else if (currentUserType === 'borrower') {
          apiEndpoint = 'http://localhost:5000/api/borrower/wallet/balance';
        } else if (currentUserType === 'admin') {
          apiEndpoint = 'http://localhost:5000/api/admin/wallet/balance';
        }
        
        console.log('Using wallet endpoint for user type:', currentUserType, '->', apiEndpoint);
        
        console.log('Trying API endpoint:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Backend wallet response:', data);
          
          // Handle different response structures
          if (data.data && data.data.wallet) {
            setWallet(data.data.wallet);
          } else if (data.data && typeof data.data.balance !== 'undefined') {
            setWallet({
              balance: data.data.balance,
              currency: data.data.currency || 'USD',
              status: data.data.status || 'active',
              limits: data.data.limits,
              stats: data.data.stats
            });
          } else {
            setWallet(data.data);
          }
          return; // Success, exit early
        } else {
          console.log('Wallet API failed with status:', response.status);
          const errorText = await response.text();
          console.log('Wallet API error:', errorText);
        }
      } catch (backendError) {
        console.log('Backend wallet API not available, using local storage');
      }
      
      // Fallback to local storage wallet system
      console.log('Using local storage wallet system');
      const localWallet = getLocalWallet(currentUserType);
      setWallet(localWallet);
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalWallet = (userType) => {
    try {
      const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
      
      if (!localWallets[userType]) {
        // Create default wallet for this user type
        const defaultWallet = {
          balance: userType === 'lender' ? 10000 : userType === 'admin' ? 50000 : 1000,
          currency: 'USD',
          status: 'active',
          userType: userType,
          createdAt: new Date().toISOString()
        };
        
        localWallets[userType] = defaultWallet;
        localStorage.setItem('localWallets', JSON.stringify(localWallets));
        
        console.log(`Created local wallet for ${userType}:`, defaultWallet);
        return defaultWallet;
      }
      
      console.log(`Loaded local wallet for ${userType}:`, localWallets[userType]);
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
        
        console.log(`Updated local wallet for ${userType} to:`, newBalance);
      }
    } catch (error) {
      console.error('Error updating local wallet:', error);
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
        className="card p-6"
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 loading-skeleton w-24"></div>
            <div className="h-6 w-6 loading-skeleton rounded"></div>
          </div>
          <div className="h-8 loading-skeleton w-32 mb-2"></div>
          <div className="h-4 loading-skeleton w-16"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 border border-error/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 font-semibold text-secondary-900 dark:text-secondary-100">
            Wallet Balance
          </h3>
          <WalletIcon className="h-6 w-6 text-error" />
        </div>
        <p className="text-error text-sm mb-4">{error}</p>
        <button
          onClick={loadWalletData}
          className="btn-primary text-sm px-3 py-1"
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
      className="loan-card p-6 cursor-pointer"
      onClick={handleWalletClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 font-semibold text-secondary-900 dark:text-secondary-100">
          Wallet Balance
        </h3>
        <div className="flex items-center space-x-2">
          <WalletIcon className="h-6 w-6 text-primary-600" />
          <ExternalLink className="h-4 w-4 text-neutral-400" />
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-1">
          ${wallet?.balance?.toLocaleString() || '0'}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {wallet?.currency || 'USD'}
          </span>
          <span className={`badge ${
            wallet?.status === 'active' 
              ? 'badge-success'
              : 'badge-error'
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
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-secondary-700">
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span>Daily Limit</span>
          <span>${wallet?.limits?.dailyDepositLimit?.toLocaleString() || '0'}</span>
        </div>
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          <span>Used Today</span>
          <span>${wallet?.dailyUsage?.depositAmount?.toLocaleString() || '0'}</span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-secondary-600 rounded-full h-1 mt-2">
          <div
            className="bg-primary-500 h-1 rounded-full transition-all duration-300"
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
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Click to view full wallet
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadWalletData();
          }}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>
    </motion.div>
  );
};

export default WalletBalanceCard;
