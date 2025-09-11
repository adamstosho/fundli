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
  Search
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
          
          // Set stats from API response
          setStats({
            totalBorrowed: statsData.data.stats.totalBorrowed,
            activeLoans: statsData.data.stats.activeLoans,
            totalRepaid: statsData.data.stats.totalRepaid,
            creditScore: statsData.data.stats.creditScore
          });
          
          // Set recent loans and upcoming payments
          setRecentLoans(statsData.data.recentLoans || []);
          setUpcomingPayments(statsData.data.upcomingPayments || []);
          
          console.log('📊 Stats updated:', {
            totalBorrowed: statsData.data.stats.totalBorrowed,
            activeLoans: statsData.data.stats.activeLoans,
            totalRepaid: statsData.data.stats.totalRepaid,
            creditScore: statsData.data.stats.creditScore
          });
        } else {
          const errorData = await statsResponse.json().catch(() => ({ message: 'Unknown error' }));
          console.error('❌ Stats API error:', errorData);
          throw new Error(`Failed to fetch borrower stats: ${errorData.message || 'Unknown error'}`);
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
          creditScore: user?.creditScore || 0
        });
        setRecentLoans([]);
        setUpcomingPayments([]);
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
      // Fetch loan trends data
      const trendsResponse = await fetch('http://localhost:5000/api/loans/trends', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setChartData(prev => ({
          ...prev,
          loanTrends: trendsData.data
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
        setChartData(prev => ({
          ...prev,
          creditScoreDistribution: creditData.data
        }));
      } else {
        console.warn('❌ Failed to fetch credit score distribution:', creditResponse.status);
        // Fallback to mock data
        setChartData(prev => ({
          ...prev,
          creditScoreDistribution: {
            labels: ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
            values: [25, 35, 20, 15, 5]
          }
        }));
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-secondary-900 dark:text-secondary-100">
            Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Borrower'}! 👋
          </h1>
          <p className="text-body text-neutral-600 dark:text-neutral-400 mt-2">
            Here's what's happening with your loans today
          </p>
        </div>
        
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 bg-error/5 border border-error/20"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-error mr-2 mt-0.5" />
            <div>
              <p className="text-error font-medium mb-2">Dashboard Data Error</p>
              <p className="text-error/80 text-sm">{error}</p>
              <div className="mt-2 text-xs text-error/70">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Borrowed
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                ${stats.totalBorrowed.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Active Loans
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stats.activeLoans}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Repaid
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                ${stats.totalRepaid.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Credit Score
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stats.creditScore}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-accent-600 dark:text-accent-400" />
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
        <h2 className="text-h3 font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
            >
              <Link
                to={action.href}
                className="block loan-card p-6 hover:shadow-medium transition-all duration-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                  {action.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                  {action.description}
                </p>
                <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Loans and Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Loans */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Loans
            </h3>
            <Link
              to="/loans/status"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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
                  className="inline-flex items-center mt-3 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Payments
            </h3>
            <Link
              to="/loans/repayment"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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
                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Loan Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <LoanTrendsChart data={chartData.loanTrends} />
        </motion.div>

        {/* Repayment Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <RepaymentStatusChart data={chartData.repaymentStatus} />
        </motion.div>
      </div>

      {/* Credit Score Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="mb-8"
      >
        <CreditScoreDistributionChart data={chartData.creditScoreDistribution} />
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