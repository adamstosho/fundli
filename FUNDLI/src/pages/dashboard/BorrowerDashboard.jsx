import { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/config';
import { Link, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  MessageSquare
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
import FeedbackInbox from '../../components/common/FeedbackInbox';

const BorrowerDashboard = () => {
  const { user, kycStatus } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    activeLoans: 0,
    totalRepaid: 0,
    creditScore: 0
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

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
        console.log('📡 Fetching borrower stats from: https://fundli-hjqn.vercel.app/api/loans/borrower-stats');
        const statsResponse = await fetch(buildApiUrl('/loans/borrower-stats'), {
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
            creditScore: statsData.data?.stats?.creditScore || user?.creditScore || 0
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
            creditScore: statsData.data?.stats?.creditScore || user?.creditScore || 0
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
            creditScore: user?.creditScore || 0
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
          creditScore: user?.creditScore || 0
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
      const trendsResponse = await fetch(buildApiUrl('/loans/trends'), {
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
      const repaymentResponse = await fetch(buildApiUrl('/loans/repayment-status'), {
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
      const creditResponse = await fetch(buildApiUrl('/loans/credit-score-distribution'), {
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
      funded: { color: 'badge-success', icon: CheckCircle, text: 'Funded' },
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

  const handleViewLoanDetails = (loan) => {
    setSelectedLoan(loan);
    setShowLoanDetailsModal(true);
  };

  const handlePayBack = (loan) => {
    // Navigate to PayBackPage with loan data
    navigate(`/payback/${loan._id}`, { 
      state: { loan } 
    });
  };

  const handleSetAutoRepay = async (loan) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Please log in to set up auto repay');
        return;
      }

      // Calculate total repayment using flat interest
      const principal = loan.loanAmount || 0;
      const interestRate = loan.interestRate || 0;
      const interestAmount = principal * (interestRate / 100);
      const totalRepayment = principal + interestAmount;
      const amountPaid = loan.amountPaid || 0;
      const amountRemaining = totalRepayment - amountPaid;

      // Calculate due date
      let dueDateText = 'N/A';
      if (loan.fundedAt && loan.duration) {
        const fundedDate = new Date(loan.fundedAt);
        const dueDate = new Date(fundedDate);
        dueDate.setMonth(dueDate.getMonth() + loan.duration);
        dueDateText = dueDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      // Confirm auto repay setup
      const confirmed = window.confirm(
        `Set up automatic repayment for this loan?\n\n` +
        `Principal Amount: $${principal.toLocaleString()}\n` +
        `Interest Amount (${interestRate}%): $${interestAmount.toLocaleString()}\n` +
        `Total Repayment: $${totalRepayment.toLocaleString()}\n` +
        `Amount Remaining: $${amountRemaining.toLocaleString()}\n` +
        `Due Date: ${dueDateText}\n` +
        `Purpose: ${loan.purpose}\n\n` +
        `This will automatically deduct the remaining amount from your wallet on the due date.`
      );
      
      if (!confirmed) return;
      
      // Set up auto repay API call
      const response = await fetch(buildApiUrl(`/loans/${loan._id}/auto-repay`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          paymentMethod: 'wallet',
          amount: amountRemaining,
          dueDate: loan.fundedAt && loan.duration ? (() => {
            const fundedDate = new Date(loan.fundedAt);
            const dueDate = new Date(fundedDate);
            dueDate.setMonth(dueDate.getMonth() + loan.duration);
            return dueDate.toISOString();
          })() : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Auto repay set up successfully! ${result.message}`);
        // Refresh dashboard data
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to set up auto repay: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error setting up auto repay:', error);
      alert('Failed to set up auto repay. Please try again.');
    }
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
    },
    {
      title: 'Feedback Inbox',
      description: 'View messages from admin',
      icon: MessageSquare,
      href: '#',
      color: 'from-purple-500 to-purple-600',
      onClick: () => setShowFeedbackModal(true)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">
            Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Borrower'}!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
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
              
              // Also trigger wallet balance refresh
              console.log('🔄 Dashboard refresh triggered, refreshing wallet balance');
              window.dispatchEvent(new CustomEvent('dashboardRefreshed'));
            }}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors text-sm font-medium"
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
          className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg p-4"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-error dark:text-error/30 font-medium mb-2">Dashboard Data Error</p>
              <p className="text-error dark:text-error/40 text-sm">{error}</p>
              <div className="mt-2 text-xs text-error dark:text-error/50">
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
          className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg p-4"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-success dark:text-success/50 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-success dark:text-success/30 font-medium mb-1">Success!</p>
              <p className="text-success dark:text-success/40 text-sm">{successMessage}</p>
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
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Borrowed
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
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
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Active Loans
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.activeLoans}
              </p>
            </div>
            <div className="w-12 h-12 bg-success/20 dark:bg-success/20 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-success dark:text-success/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Repaid
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
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
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Credit Score
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
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
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4">
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
              {action.onClick ? (
                <button
                  onClick={action.onClick}
                  className="w-full text-left bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                    {action.description}
                  </p>
                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </button>
              ) : (
                <Link
                  to={action.href}
                  className="block bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
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
              )}
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
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
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
                <div key={loan._id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-secondary-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-secondary-900 dark:text-white">
                        ${loan.loanAmount?.toLocaleString() || 0}
                      </h4>
                      {getStatusBadge(loan.status)}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {loan.purpose}
                    </p>
                    {loan.nextPaymentDate && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        Next payment: {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">
                      ${((loan.loanAmount || 0) - (loan.amountPaid || 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      Remaining
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">No loans found</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
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

        {/* Upcoming Payments - Only Funded Loans */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
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
            {recentLoans.filter(loan => loan.status === 'funded' || loan.status === 'active').length > 0 ? (
              recentLoans
                .filter(loan => loan.status === 'funded' || loan.status === 'active')
                .map((loan) => (
                  <div key={loan._id} className="p-4 bg-neutral-50 dark:bg-secondary-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-secondary-900 dark:text-white">
                          ${loan.loanAmount?.toLocaleString() || 0}
                        </h4>
                        <span className="badge-success">Funded</span>
                      </div>
                      <button
                        onClick={() => handleViewLoanDetails(loan)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        View Details
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Purpose: {loan.purpose}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Principal: ${loan.loanAmount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Interest Rate: {loan.interestRate || 0}% (Flat Rate)
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Interest Amount: ${((loan.loanAmount || 0) * (loan.interestRate || 0) / 100).toLocaleString()}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Total Repayment: ${((loan.loanAmount || 0) + ((loan.loanAmount || 0) * (loan.interestRate || 0) / 100)).toLocaleString()}
                      </p>
                      {loan.fundedAt && loan.duration && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Due Date: {(() => {
                            const fundedDate = new Date(loan.fundedAt);
                            const dueDate = new Date(fundedDate);
                            dueDate.setMonth(dueDate.getMonth() + loan.duration);
                            return dueDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          })()}
                        </p>
                      )}
                    </div>
                    
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">No funded loans</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                  Apply for loans to see upcoming payments here
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
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-8">
              <div className="h-[400px] w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-8">
              <div className="h-[400px] w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-8">
            <div className="h-[400px] w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackInbox onClose={() => setShowFeedbackModal(false)} />
      )}

      {/* Loan Details Modal */}
      {showLoanDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Loan Details
              </h3>
              <button
                onClick={() => setShowLoanDetailsModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Loan Summary */}
              <div className="bg-neutral-50 dark:bg-secondary-900 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Loan Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Purpose:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedLoan.purpose}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLoan.status).props.className}`}>
                      {selectedLoan.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Principal Amount:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">${selectedLoan.loanAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Interest Rate:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedLoan.interestRate || 0}% (Flat Rate)</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Loan Duration:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedLoan.duration} months</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Interest Amount:</span>
                    <p className="font-medium text-orange-600 dark:text-orange-400">
                      ${((selectedLoan.loanAmount || 0) * (selectedLoan.interestRate || 0) / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Flat Rate Explanation */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Flat Interest Rate System</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Interest is calculated once for the entire {selectedLoan.duration || 0}-month period. 
                        You pay the principal amount plus {selectedLoan.interestRate || 0}% interest at the end of the loan term.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Repayment Information */}
              <div className="bg-neutral-50 dark:bg-secondary-900 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Repayment Information</h4>
                
                {/* Calculate flat interest total repayment */}
                {(() => {
                  const principal = selectedLoan.loanAmount || 0;
                  const interestRate = selectedLoan.interestRate || 0;
                  const interestAmount = principal * (interestRate / 100);
                  const totalRepayment = principal + interestAmount;
                  const amountPaid = selectedLoan.amountPaid || 0;
                  const amountRemaining = totalRepayment - amountPaid;
                  const progressPercentage = totalRepayment > 0 ? Math.round((amountPaid / totalRepayment) * 100) : 0;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Principal Amount:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          ${principal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Interest Amount ({interestRate}%):</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          ${interestAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-200 dark:border-secondary-700 pt-2">
                        <span className="text-neutral-600 dark:text-neutral-400">Total Repayment:</span>
                        <span className="font-bold text-lg text-secondary-900 dark:text-white">
                          ${totalRepayment.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Amount Paid:</span>
                        <span className="font-medium text-success-600 dark:text-success-400">
                          ${amountPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Amount Remaining:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          ${amountRemaining.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Due Date:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {(() => {
                            if (selectedLoan.fundedAt && selectedLoan.duration) {
                              const fundedDate = new Date(selectedLoan.fundedAt);
                              const dueDate = new Date(fundedDate);
                              dueDate.setMonth(dueDate.getMonth() + selectedLoan.duration);
                              return dueDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            }
                            return 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Repayment Progress</span>
                    <span className="text-sm font-medium text-secondary-900 dark:text-white">
                      {(() => {
                        const principal = selectedLoan.loanAmount || 0;
                        const interestRate = selectedLoan.interestRate || 0;
                        const totalRepayment = principal + (principal * (interestRate / 100));
                        const amountPaid = selectedLoan.amountPaid || 0;
                        return totalRepayment > 0 ? Math.round((amountPaid / totalRepayment) * 100) : 0;
                      })()}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-secondary-700 rounded-full h-3">
                    <div 
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(() => {
                          const principal = selectedLoan.loanAmount || 0;
                          const interestRate = selectedLoan.interestRate || 0;
                          const totalRepayment = principal + (principal * (interestRate / 100));
                          const amountPaid = selectedLoan.amountPaid || 0;
                          return totalRepayment > 0 ? (amountPaid / totalRepayment) * 100 : 0;
                        })()}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-neutral-50 dark:bg-secondary-900 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Loan Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Applied Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.createdAt ? new Date(selectedLoan.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Funded Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.fundedAt ? new Date(selectedLoan.fundedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not Funded Yet'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Repayment Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {(() => {
                        if (selectedLoan.fundedAt && selectedLoan.duration) {
                          const fundedDate = new Date(selectedLoan.fundedAt);
                          const repaymentDate = new Date(fundedDate);
                          repaymentDate.setMonth(repaymentDate.getMonth() + selectedLoan.duration);
                          return repaymentDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Loan Duration:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.duration} months
                    </span>
                  </div>
                </div>
                
                {/* Days remaining calculation */}
                {(() => {
                  if (selectedLoan.fundedAt && selectedLoan.duration) {
                    const fundedDate = new Date(selectedLoan.fundedAt);
                    const repaymentDate = new Date(fundedDate);
                    repaymentDate.setMonth(repaymentDate.getMonth() + selectedLoan.duration);
                    const today = new Date();
                    const diffTime = repaymentDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            {diffDays > 0 ? `${diffDays} days until repayment` : diffDays === 0 ? 'Repayment due today' : `${Math.abs(diffDays)} days overdue`}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handlePayBack(selectedLoan)}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  Pay Back
                </button>
                <button
                  onClick={() => handleSetAutoRepay(selectedLoan)}
                  className="flex-1 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors font-medium"
                >
                  Set Auto Repay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowerDashboard; 