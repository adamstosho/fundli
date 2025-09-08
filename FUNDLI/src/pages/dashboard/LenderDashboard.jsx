import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Plus,
  Eye,
  CreditCard,
  ArrowRight,
  PieChart,
  Target,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoanApplications from '../../components/lender/LoanApplications';
import PendingLoansSection from '../../components/common/PendingLoansSection';
import WalletBalanceCard from '../../components/common/WalletBalanceCard';

const LenderDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    totalReturns: 0,
    averageROI: 0
  });
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [portfolioBreakdown, setPortfolioBreakdown] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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

        // Fetch lender's investment data
        const investmentsResponse = await fetch('http://localhost:5000/api/investments/lender', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json();
          console.log('Fetched investments data:', investmentsData);
          
          // Process investments data
          const activeInvestments = investmentsData.data?.investments?.filter(inv => inv.status === 'active') || [];
          const totalInvested = investmentsData.data?.investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
          const totalReturns = investmentsData.data?.investments?.reduce((sum, inv) => sum + (inv.returns || 0), 0) || 0;
          const averageROI = activeInvestments.length > 0 
            ? activeInvestments.reduce((sum, inv) => sum + (inv.roi || 0), 0) / activeInvestments.length 
            : 0;
          
          setStats({
            totalInvested,
            activeInvestments: activeInvestments.length,
            totalReturns,
            averageROI: parseFloat(averageROI.toFixed(1))
          });

          setRecentInvestments(investmentsData.data?.investments || []);
          
          // Calculate portfolio breakdown
          const breakdown = {};
          investmentsData.data?.investments?.forEach(inv => {
            const category = inv.loanPurpose || 'Other';
            if (!breakdown[category]) {
              breakdown[category] = { amount: 0, count: 0 };
            }
            breakdown[category].amount += inv.amount || 0;
            breakdown[category].count += 1;
          });
          
          const portfolioData = Object.entries(breakdown).map(([category, data]) => ({
            category,
            amount: data.amount,
            percentage: totalInvested > 0 ? Math.round((data.amount / totalInvested) * 100) : 0,
            color: 'bg-primary-500'
          }));
          
          setPortfolioBreakdown(portfolioData);
        } else {
          console.warn('Failed to fetch investments data:', investmentsResponse.status);
          // Set default values for investments but don't throw error
          setStats({
            totalInvested: 0,
            activeInvestments: 0,
            totalReturns: 0,
            averageROI: 0
          });
          setRecentInvestments([]);
          setPortfolioBreakdown([]);
        }

        // Fetch user's created pools
        console.log('Fetching user pools...');
        const poolsResponse = await fetch('http://localhost:5000/api/pools/my-pools', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Pools response status:', poolsResponse.status);
        console.log('Pools response ok:', poolsResponse.ok);

        if (poolsResponse.ok) {
          const poolsData = await poolsResponse.json();
          console.log('Fetched pools data:', poolsData);
          console.log('Pools array:', poolsData.data?.pools);
          setMyPools(poolsData.data?.pools || []);
        } else {
          const errorText = await poolsResponse.text();
          console.warn('Failed to fetch pools data:', poolsResponse.status, errorText);
          setMyPools([]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Some dashboard data failed to load. Please try again later.');
        
        // Set default values if API fails
        setStats({
          totalInvested: 0,
          activeInvestments: 0,
          totalReturns: 0,
          averageROI: 0
        });
        setRecentInvestments([]);
        setPortfolioBreakdown([]);
        setMyPools([]); // Also set empty pools array
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const quickActions = [
    {
      title: 'Create Lending Pool',
      description: 'Set up a new investment pool',
      icon: Plus,
      href: '/marketplace/create-pool',
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Browse Loans',
      description: 'Find new investment opportunities',
      icon: Eye,
      href: '/marketplace/browse',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      title: 'Portfolio Analytics',
      description: 'View detailed performance metrics',
      icon: BarChart3,
      href: '/dashboard/lender',
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's your investment portfolio overview
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Portfolio Overview
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Loan Applications
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
      {/* Stats Overview */}
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
                Total Invested
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalInvested.toLocaleString()}
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
                Active Investments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeInvestments}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
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
                Total Returns
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalReturns.toLocaleString()}
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
                Average ROI
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageROI}%
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Wallet Balance */}
      <div className="mb-8">
        <WalletBalanceCard userType="lender" />
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
                className="block card p-6 hover:shadow-medium transition-all duration-200 group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
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
                <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Portfolio Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Portfolio Breakdown
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {portfolioBreakdown.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${item.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {item.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Investments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Investments
            </h3>
            <Link
              to="/marketplace/browse"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentInvestments.map((investment) => (
              <div key={investment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      ${investment.amount.toLocaleString()}
                    </h4>
                    <span className="badge-success">Active</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {investment.borrower} - {investment.purpose}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    ROI: {investment.roi}% | Next payment: {new Date(investment.nextPayment).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">
                    +{investment.roi}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    ROI
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* KYC Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            KYC Management
          </h3>
          <Link
            to="/lender/kyc"
            className="btn-primary-sm flex items-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span>Manage KYC</span>
          </Link>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Review Borrower KYC Applications
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage and approve borrower KYC verifications to enable loan processing
          </p>
          <Link
            to="/lender/kyc"
            className="btn-primary-sm"
          >
            Go to KYC Management
          </Link>
        </div>
      </motion.div>

      {/* My Pools Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Lending Pools
          </h3>
          <Link
            to="/marketplace/create-pool"
            className="btn-primary-sm flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Pool</span>
          </Link>
        </div>
        
        {myPools.length > 0 ? (
          <div className="space-y-4">
            {myPools.map((pool) => (
              <div key={pool.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {pool.name}
                    </h4>
                    <span className={`badge-${pool.status === 'active' ? 'success' : 'warning'}`}>
                      {pool.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {pool.description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Pool Size</p>
                      <p className="font-medium text-gray-900 dark:text-white">${pool.poolSize.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Interest Rate</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pool.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pool.duration} months</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500">Progress</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pool.fundingProgress}%</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <Link
                    to={`/marketplace/pool/${pool.id}`}
                    className="btn-outline-sm flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No pools created yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start creating lending pools to begin earning returns
            </p>
            <Link
              to="/marketplace/create-pool"
              className="btn-primary-sm"
            >
              Create Your First Pool
            </Link>
          </div>
        )}
      </motion.div>

      {/* KYC verification is now optional */}

      {/* Pending Loans Section */}
      <PendingLoansSection userType="lender" title="Available Loan Applications" />

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Overview
          </h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg">
              1M
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
              3M
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
              1Y
            </button>
          </div>
        </div>
        
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Performance chart will be displayed here
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Integration with Chart.js coming soon
            </p>
          </div>
        </div>
      </motion.div>
        </>
      )}

      {/* Loan Applications Tab */}
      {activeTab === 'applications' && (
        <LoanApplications />
      )}
    </div>
  );
};

export default LenderDashboard; 