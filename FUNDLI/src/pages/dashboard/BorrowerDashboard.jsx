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
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setError('');
        setIsLoading(true);
        
        // Fetch real data from backend API
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch user's loan data
        const loansResponse = await fetch('http://localhost:5000/api/loans/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (loansResponse.ok) {
          const loansData = await loansResponse.json();
          console.log('Fetched loans data:', loansData);
          
          // Process loans data
          const activeLoans = loansData.loans?.filter(loan => loan.status === 'active') || [];
          const pendingLoans = loansData.loans?.filter(loan => loan.status === 'pending') || [];
          
          setRecentLoans(loansData.loans || []);
          
          // Calculate stats from real data
          const totalBorrowed = loansData.loans?.reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0;
          const totalRepaid = loansData.loans?.reduce((sum, loan) => sum + (loan.repaidAmount || 0), 0) || 0;
          
          setStats({
            totalBorrowed,
            activeLoans: activeLoans.length,
            totalRepaid,
            creditScore: user?.creditScore || 0
          });

          // Get upcoming payments from active loans
          const payments = activeLoans
            .filter(loan => loan.nextPaymentDate)
            .map(loan => ({
              id: loan._id,
              amount: loan.monthlyPayment || loan.amount / loan.term,
              dueDate: loan.nextPaymentDate,
              loanPurpose: loan.purpose
            }));
          
          setUpcomingPayments(payments);
        } else {
          throw new Error('Failed to fetch loans data');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        
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
    }
  }, [user]);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's what's happening with your loans today
          </p>
        </div>
        
        {kycStatus === 'pending' && (
          <div className="mt-4 lg:mt-0">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <span className="text-sm text-warning font-medium">
                  KYC verification pending
                </span>
              </div>
              <p className="text-xs text-warning/80 mt-1">
                Complete your KYC to access all features
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 bg-red-50 border border-red-200"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Borrowed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Loans
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Repaid
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Credit Score
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.creditScore}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
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
                className="card p-6 hover:shadow-medium transition-all duration-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {action.description}
                </p>
                <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
                        ${loan.amount.toLocaleString()}
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
                      ${(loan.amount - (loan.repaidAmount || 0)).toLocaleString()}
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

      {/* KYC Status */}
      {kycStatus === 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Complete Your KYC Verification
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Verify your identity to unlock all platform features and apply for loans
                </p>
              </div>
            </div>
            <Link
              to="/kyc-upload"
              className="btn-primary"
            >
              Complete KYC
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BorrowerDashboard; 