import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  FileText, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminLoanManagement from '../../components/admin/AdminLoanManagement';
import AdminCollateralReview from '../../components/admin/AdminCollateralReview';
import PendingLoansSection from '../../components/common/PendingLoansSection';
import WalletBalanceCard from '../../components/common/WalletBalanceCard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    pendingLoans: 0,
    totalTransactions: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [creatingTestData, setCreatingTestData] = useState(false);

  useEffect(() => {
    // Load real admin dashboard data
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Fetch admin dashboard statistics
        const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.data;
          
          // Update stats with real data
          setStats({
            totalUsers: data.users.total,
            pendingKYC: data.users.pendingKYC,
            pendingLoans: data.loans.pending,
            totalTransactions: data.loans.total + data.pools.total
          });
          
          // Process recent activities
          const activities = [];
          
          // Add recent users
          data.recentActivities.users.forEach(user => {
            activities.push({
              id: user._id,
              type: 'user_registered',
              message: `${user.firstName} ${user.lastName} registered as ${user.userType}`,
              timestamp: user.createdAt,
              userType: user.userType
            });
          });
          
          // Add recent KYC submissions
          data.recentActivities.kyc.forEach(kyc => {
            activities.push({
              id: kyc._id,
              type: `kyc_${kyc.kycStatus}`,
              message: `${kyc.firstName} ${kyc.lastName} KYC status: ${kyc.kycStatus}`,
              timestamp: kyc.createdAt,
              userType: 'kyc'
            });
          });
          
          // Add recent loans
          data.recentActivities.loans.forEach(loan => {
            activities.push({
              id: loan._id,
              type: `loan_${loan.status}`,
              message: `Loan application for $${loan.loanAmount} - ${loan.purpose} (${loan.status})`,
              timestamp: loan.createdAt,
              userType: 'loan'
            });
          });
          
          // Sort activities by timestamp
          activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setRecentActivities(activities.slice(0, 10));
          
        } else {
          throw new Error('Failed to fetch admin dashboard data');
        }
      } catch (error) {
        console.error('Error loading admin dashboard data:', error);
        // Set default values if API fails
        setStats({
          totalUsers: 0,
          pendingKYC: 0,
          pendingLoans: 0,
          totalTransactions: 0
        });
        setRecentActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getActivityIcon = (type) => {
    const iconConfig = {
      kyc_approved: { icon: CheckCircle, color: 'text-success' },
      loan_approved: { icon: CheckCircle, color: 'text-success' },
      kyc_pending: { icon: Clock, color: 'text-warning' },
      loan_pending: { icon: Clock, color: 'text-warning' },
      kyc_rejected: { icon: AlertCircle, color: 'text-error' },
      loan_rejected: { icon: AlertCircle, color: 'text-error' }
    };

    const config = iconConfig[type] || iconConfig.kyc_pending;
    const Icon = config.icon;

    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'KYC Management',
      description: 'Review and approve KYC submissions',
      icon: Shield,
      href: '/admin/kyc',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      title: 'Loan Management',
      description: 'Review and approve loan applications',
      icon: FileText,
      href: '/admin/loans',
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
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user?.name}. Here's your platform overview.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'loans'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Loan Applications
          </button>
          <button
            onClick={() => setActiveTab('collateral')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'collateral'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Collateral Verification
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Overview */}
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
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                    Pending KYC
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingKYC}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
                    Pending Loans
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingLoans}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                    Total Transactions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </motion.div>
          </div>

      {/* Wallet Balance */}
      <div className="mb-8">
        <WalletBalanceCard userType="admin" />
      </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      Access
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activities
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User Type: {activity.userType}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pending Loans Section */}
      <PendingLoansSection userType="admin" title="All Pending Loans" />

          {/* Platform Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Platform Status: Healthy
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All systems are running smoothly
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">99.9%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Loan Applications Tab */}
      {activeTab === 'loans' && (
        <AdminLoanManagement />
      )}

      {/* Collateral Verification Tab */}
      {activeTab === 'collateral' && (
        <AdminCollateralReview />
      )}
    </div>
  );
};

export default AdminDashboard; 