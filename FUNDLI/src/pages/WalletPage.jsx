import { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Minus, 
  ArrowUpDown, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowRight,
  History,
  DollarSign,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const [walletResponse, transactionsResponse] = await Promise.all([
        fetch(buildApiUrl('/wallet'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(buildApiUrl('/wallet/transactions'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData.data.wallet);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.data.transactions);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <Plus className="h-4 w-4 text-success" />;
      case 'withdrawal': return <Minus className="h-4 w-4 text-error" />;
      case 'transfer_in': return <ArrowUpDown className="h-4 w-4 text-primary-600" />;
      case 'transfer_out': return <ArrowUpDown className="h-4 w-4 text-orange-600" />;
      case 'loan_payment': return <CreditCard className="h-4 w-4 text-accent-600" />;
      case 'loan_disbursement': return <DollarSign className="h-4 w-4 text-success" />;
      default: return <CreditCard className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
      case 'loan_disbursement':
        return 'text-success bg-success/20 dark:bg-success/20 dark:text-success/50';
      case 'withdrawal':
      case 'transfer_out':
        return 'text-error bg-error/20 dark:bg-error/20 dark:text-error/50';
      case 'loan_payment':
        return 'text-accent-600 bg-accent-100 dark:bg-accent-900/20 dark:text-accent-400';
      default:
        return 'text-neutral-600 bg-neutral-100 dark:bg-secondary-900/20 dark:text-neutral-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'failed': return <XCircle className="h-4 w-4 text-error" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-neutral-600" />;
      default: return <AlertCircle className="h-4 w-4 text-neutral-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-secondary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Error</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={loadWalletData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-secondary-900 py-8">
      <div className="container-responsive">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 text-neutral-900 dark:text-white flex items-center">
            <WalletIcon className="h-8 w-8 mr-3 text-primary-600" />
            My Wallet
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Manage your funds, deposits, and transfers
          </p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 text-neutral-900 dark:text-white">
                Available Balance
              </h3>
              <WalletIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              ${wallet?.balance?.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {wallet?.currency || 'USD'}
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h3 className="text-h3 text-neutral-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full btn-success flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Deposit</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full btn-error flex items-center justify-center space-x-2"
              >
                <Minus className="h-4 w-4" />
                <span>Withdraw</span>
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Transfer</span>
              </button>
            </div>
          </motion.div>

          {/* Wallet Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h3 className="text-h3 text-neutral-900 dark:text-white mb-4">
              Wallet Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Status</span>
                <span className={`badge ${wallet?.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                  {wallet?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Daily Limit</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  ${wallet?.limits?.dailyDepositLimit?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Used Today</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  ${wallet?.dailyUsage?.depositAmount?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('limits')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'limits'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Limits & Usage
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-h3 text-neutral-900 dark:text-white">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.reference}
                      className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          ['deposit', 'transfer_in', 'loan_disbursement'].includes(transaction.type)
                            ? 'text-success'
                            : 'text-error'
                        }`}>
                          {['deposit', 'transfer_in', 'loan_disbursement'].includes(transaction.type) ? '+' : '-'}
                          ${transaction.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(transaction.status)}
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize">
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <h3 className="text-h3 text-neutral-900 dark:text-white">
                  All Transactions
                </h3>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.reference}
                      className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {transaction.reference} • {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          ['deposit', 'transfer_in', 'loan_disbursement'].includes(transaction.type)
                            ? 'text-success'
                            : 'text-error'
                        }`}>
                          {['deposit', 'transfer_in', 'loan_disbursement'].includes(transaction.type) ? '+' : '-'}
                          ${transaction.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(transaction.status)}
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize">
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'limits' && (
              <div className="space-y-6">
                <h3 className="text-h3 text-neutral-900 dark:text-white">
                  Usage & Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-neutral-900 dark:text-white">Daily Activity</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Deposited Today</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          ${wallet?.dailyUsage?.depositAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Withdrawn Today</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          ${wallet?.dailyUsage?.withdrawalAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Transferred Today</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          ${wallet?.dailyUsage?.transferAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-neutral-900 dark:text-white">Monthly Limits</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Deposit Limit</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          ${wallet?.limits?.monthlyDepositLimit?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Used This Month</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          ${wallet?.monthlyUsage?.depositAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              ((wallet?.monthlyUsage?.depositAmount || 0) / (wallet?.limits?.monthlyDepositLimit || 1)) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
