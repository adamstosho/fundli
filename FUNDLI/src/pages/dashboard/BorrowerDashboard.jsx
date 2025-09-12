import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Plus,
  Eye,
  FileText,
  CreditCard,
  ArrowRight,
  BarChart3,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PendingLoansSection from '../../components/common/PendingLoansSection';
import InProgressLoansSection from '../../components/common/InProgressLoansSection';
import WalletBalanceCard from '../../components/common/WalletBalanceCard';
import CollateralVerificationStatus from '../../components/common/CollateralVerificationStatus';
import { 
  LoanTrendsChart, 
  RepaymentStatusChart, 
  CreditScoreDistributionChart 
} from '../../components/charts/DashboardCharts';

const BorrowerDashboard = () => {
  const { user, kycStatus } = useAuth();
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    activeLoans: 0,
    totalRepaid: 0,
    creditScore: user?.creditScore || 0
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [chartData, setChartData] = useState({
    loanTrends: null,
    repaymentStatus: null,
    creditScoreDistribution: null
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setError('');
        setIsLoading(true);
        
        console.log('🔍 Loading borrower dashboard data...');
        console.log('👤 Current user:', user);
        
        // Fetch real data from backend API
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        console.log('🔑 Token exists:', !!token);
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');

        // Fetch comprehensive borrower stats
        console.log('📡 Fetching borrower stats from: http://localhost:5000/api/loans/borrower-stats');
        const statsResponse = await fetch('http://localhost:5000/api/loans/borrower-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 Stats response status:', statsResponse.status);
        console.log('📡 Stats response ok:', statsResponse.ok);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Fetched borrower stats:', statsData);
          console.log('📊 Raw stats data:', statsData.data?.stats);
          
          // Set stats from API response with proper fallbacks
          const newStats = {
            totalBorrowed: statsData.data?.stats?.totalBorrowed || 0,
            activeLoans: statsData.data?.stats?.activeLoans || 0,
            totalRepaid: statsData.data?.stats?.totalRepaid || 0,
            creditScore: statsData.data?.stats?.creditScore || user?.creditScore || 650
          };
          
          console.log('📊 Setting stats to:', newStats);
          setStats(newStats);
          
          // Set recent loans and upcoming payments with proper fallbacks
          setRecentLoans(statsData.data?.recentLoans || []);
          setUpcomingPayments(statsData.data?.upcomingPayments || []);
          
          // Show success message
          setSuccessMessage('Dashboard data loaded successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
          
          console.log('📊 Stats updated:', {
            totalBorrowed: statsData.data?.stats?.totalBorrowed || 0,
            activeLoans: statsData.data?.stats?.activeLoans || 0,
            totalRepaid: statsData.data?.stats?.totalRepaid || 0,
            creditScore: statsData.data?.stats?.creditScore || user?.creditScore || 650
          });
        } else {
          const errorData = await statsResponse.json().catch(() => ({ message: 'Unknown error' }));
          console.error('❌ Stats API error:', errorData);
          
          // Set default values instead of throwing error
          console.log('⚠️ Using default values due to API error');
          setStats({
            totalBorrowed: 0,
            activeLoans: 0,
            totalRepaid: 0,
            creditScore: user?.creditScore || 650
          });
          setRecentLoans([]);
          setUpcomingPayments([]);
        }

        // Fetch chart data
        await fetchChartData(token);

      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        setError(`Failed to load dashboard data: ${error.message}`);
        
        // Set default values if API fails
        setStats({
          totalBorrowed: 0,
          activeLoans: 0,
          totalRepaid: 0,
          creditScore: user?.creditScore || 650
        });
        setRecentLoans([]);
        setUpcomingPayments([]);
        
        // Set fallback chart data
        setChartData({
          loanTrends: {
            labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            applied: [0, 0, 0, 0, 0, 0],
            approved: [0, 0, 0, 0, 0, 0],
            funded: [0, 0, 0, 0, 0, 0]
          },
          repaymentStatus: {
            labels: ['On Time', 'Late', 'Overdue', 'Paid'],
            values: [0, 0, 0, 0]
          },
          creditScoreDistribution: {
            labels: ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
            values: [0, 0, 1, 0, 0] // Default to Fair
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    } else {
      console.log('⚠️ No user found, skipping dashboard data load');
      setIsLoading(false);
    }
  }, [user]);

  // Fetch chart data
  const fetchChartData = async (token) => {
    try {
      console.log('📊 Fetching chart data...');
      
      // Fetch loan trends data
      const trendsResponse = await fetch('http://localhost:5000/api/loans/trends', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        console.log('✅ Loan trends data:', trendsData.data);
        setChartData(prev => ({
          ...prev,
          loanTrends: trendsData.data
        }));
      } else {
        console.warn('❌ Failed to fetch loan trends:', trendsResponse.status);
        // Set fallback data for trends
        setChartData(prev => ({
          ...prev,
          loanTrends: {
            labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            applied: [0, 0, 0, 0, 0, 0],
            approved: [0, 0, 0, 0, 0, 0],
            funded: [0, 0, 0, 0, 0, 0]
          }
        }));
      }

      // Fetch repayment status data
      const repaymentResponse = await fetch('http://localhost:5000/api/loans/repayment-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (repaymentResponse.ok) {
        const repaymentData = await repaymentResponse.json();
        console.log('✅ Repayment status data:', repaymentData.data);
        setChartData(prev => ({
          ...prev,
          repaymentStatus: repaymentData.data
        }));
      } else {
        console.warn('❌ Failed to fetch repayment status:', repaymentResponse.status);
        // Set fallback data for repayment status
        setChartData(prev => ({
          ...prev,
          repaymentStatus: {
            labels: ['On Time', 'Late', 'Overdue', 'Paid'],
            values: [0, 0, 0, 0]
          }
        }));
      }

      // Fetch credit score distribution data
      const creditResponse = await fetch('http://localhost:5000/api/loans/credit-score-distribution', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (creditResponse.ok) {
        const creditData = await creditResponse.json();
        console.log('✅ Credit score distribution data:', creditData.data);
        setChartData(prev => ({
          ...prev,
          creditScoreDistribution: creditData.data
        }));
      } else {
        console.warn('❌ Failed to fetch credit score distribution:', creditResponse.status);
        // Set fallback data based on user's credit score
        const userCreditScore = user?.creditScore || 650;
        let fallbackValues = [0, 0, 0, 0, 0];
        if (userCreditScore >= 750) fallbackValues[0] = 1;
        else if (userCreditScore >= 700) fallbackValues[1] = 1;
        else if (userCreditScore >= 650) fallbackValues[2] = 1;
        else if (userCreditScore >= 600) fallbackValues[3] = 1;
        else fallbackValues[4] = 1;
        
        setChartData(prev => ({
          ...prev,
          creditScoreDistribution: {
            labels: ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
            values: fallbackValues
          }
        }));
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Set all fallback data on error
      setChartData({
        loanTrends: {
          labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          applied: [0, 0, 0, 0, 0, 0],
          approved: [0, 0, 0, 0, 0, 0],
          funded: [0, 0, 0, 0, 0, 0]
        },
        repaymentStatus: {
          labels: ['On Time', 'Late', 'Overdue', 'Paid'],
          values: [0, 0, 0, 0]
        },
        creditScoreDistribution: {
          labels: ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
          values: [0, 0, 1, 0, 0] // Default to Fair
        }
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'badge-success', icon: CheckCircle, text: 'Active' },
      pending: { color: 'badge-warning', icon: Clock, text: 'Pending' },
      completed: { color: 'badge-info', icon: CheckCircle, text: 'Completed' },
      overdue: { color: 'badge-error', icon: AlertCircle, text: 'Overdue' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </span>
    );
  };

  const quickActions = [
    {
      title: 'Apply for Loan',
      description: 'Submit a new loan application',
      icon: Plus,
      href: '/loans/apply',
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Browse Loans',
      description: 'Find available loans to apply for',
      icon: Search,
      href: '/borrower/browse-loans',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'View Loans',
      description: 'Check your loan status and details',
      icon: Eye,
      href: '/loans/status',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      title: 'Repayment Schedule',
      description: 'View upcoming payments and history',
      icon: Calendar,
      href: '/loans/repayment',
      color: 'from-accent-500 to-accent-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Borrower'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your loans today
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              setError('');
              setSuccessMessage('');
              setIsLoading(true);
              loadDashboardData();
            }}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium mb-2">Dashboard Data Error</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                <p>Possible solutions:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Check your internet connection</li>
                  <li>Refresh the page</li>
                  <li>Log out and log back in</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium mb-1">Success!</p>
              <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Borrowed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalBorrowed.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Loans
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeLoans}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Repaid
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalRepaid.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Credit Score
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.creditScore}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Wallet Balance */}
      <div className="mb-8">
        <WalletBalanceCard userType="borrower" />
      </div>

      {/* Collateral Verification Status */}
      <div className="mb-8">
        <CollateralVerificationStatus 
          userId={user?.id} 
          userType="borrower" 
          onReapply={() => {
            // Navigate to collateral verification page
            window.location.href = '/loans/apply';
          }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
            >
              <Link
                to={action.href}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {action.description}
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Loans and Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Loans
            </h3>
            <Link
              to="/loans/status"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentLoans.length > 0 ? (
              recentLoans.map((loan) => (
                <div key={loan._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        ${loan.loanAmount?.toLocaleString() || 0}
                      </h4>
                      {getStatusBadge(loan.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {loan.purpose}
                    </p>
                    {loan.nextPaymentDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Next payment: {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${((loan.loanAmount || 0) - (loan.amountPaid || 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Remaining
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No loans found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Start by applying for your first loan
                </p>
                <Link
                  to="/loans/apply"
                  className="inline-flex items-center mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Apply for Loan
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Payments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Payments
            </h3>
            <Link
              to="/loans/repayment"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View Schedule
            </Link>
          </div>
          
          <div className="space-y-4">
            {upcomingPayments.length > 0 ? (
              upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        ${payment.amount.toLocaleString()}
                      </h4>
                      <span className="badge-warning">Due Soon</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {payment.loanPurpose}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      Pay Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No upcoming payments</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  You're all caught up on payments
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="h-[400px] w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : (
            <LoanTrendsChart data={chartData.loanTrends} />
          )}
        </motion.div>

        {/* Repayment Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="h-[400px] w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : (
            <RepaymentStatusChart data={chartData.repaymentStatus} />
          )}
        </motion.div>
      </div>

      {/* Credit Score Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="h-[400px] w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : (
          <CreditScoreDistributionChart data={chartData.creditScoreDistribution} />
        )}
      </motion.div>

      {/* Pending Loans Section */}
      <PendingLoansSection userType="borrower" title="My Pending Loans" />

      {/* In Progress Loans Section */}
      <InProgressLoansSection />

      {/* KYC verification is now optional */}
    </div>
  );
};

export default BorrowerDashboard; 