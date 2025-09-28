import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, BarChart3, Eye, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PoolDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [pool, setPool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // KYC verification is now optional - all users can view pool details

  useEffect(() => {
    const loadPool = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`http://localhost:5000/api/pools/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Pool not found');
          }
          throw new Error('Failed to fetch pool details');
        }

        const result = await response.json();
        setPool(result.data.pool);
      } catch (error) {
        console.error('Error loading pool:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPool();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link
              to="/marketplace/browse"
              className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Loans
            </Link>
          </div>
        </div>
        
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-2">
          Error Loading Pool
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {error}
        </p>
        <Link
          to="/marketplace/browse"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Loans
        </Link>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-2">
          Pool Not Found
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          The requested pool could not be found.
        </p>
        <Link
          to="/marketplace/browse"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Loans
        </Link>
      </div>
    );
  }

  // Safe values with fallbacks
  const poolSize = pool.size || 0;
  const fundedAmount = pool.funded || 0;
  const interestRate = pool.interestRate || 0;
  const investors = pool.investors || 0;
  const duration = pool.duration || 0;
  const poolName = pool.name || 'Pool Details';
  const poolId = pool.id || 'N/A';
  const createdAt = pool.createdAt ? new Date(pool.createdAt).toLocaleDateString() : 'N/A';
  const loans = pool.loans || [];
  
  const fundingProgress = poolSize > 0 ? (fundedAmount / poolSize) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            to="/marketplace/browse"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Loans
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          {poolName}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Pool ID: {poolId} • Created {createdAt}
        </p>
      </div>

      {/* Pool Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pool Size</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                ${poolSize.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
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
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Funded Amount</p>
              <p className="text-2xl font-bold text-success">
                ${fundedAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success-600 dark:text-success-400" />
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
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Interest Rate</p>
              <p className="text-2xl font-bold text-accent">
                {interestRate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-accent-600 dark:text-accent-400" />
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
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Investors</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {investors}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Funding Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Funding Progress
          </h3>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {fundedAmount.toLocaleString()} of {poolSize.toLocaleString()} funded
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${fundingProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          <span>0%</span>
          <span>{Math.round(fundingProgress)}%</span>
          <span>100%</span>
        </div>
      </motion.div>

      {/* Pool Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Pool Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-secondary-700">
            <span className="text-neutral-600 dark:text-neutral-400">Pool Name</span>
            <span className="font-medium text-secondary-900 dark:text-white">{poolName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-secondary-700">
            <span className="text-neutral-600 dark:text-neutral-400">Duration</span>
            <span className="font-medium text-secondary-900 dark:text-white">{duration} months</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-secondary-700">
            <span className="text-neutral-600 dark:text-neutral-400">Interest Rate</span>
            <span className="font-medium text-accent">{interestRate}% annually</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-secondary-700">
            <span className="text-neutral-600 dark:text-neutral-400">Risk Level</span>
            <span className="font-medium text-secondary-900 dark:text-white capitalize">{pool.riskLevel || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-secondary-700">
            <span className="text-neutral-600 dark:text-neutral-400">Status</span>
            <span className="font-medium text-success capitalize">{pool.status || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-600 dark:text-neutral-400">Created</span>
            <span className="font-medium text-secondary-900 dark:text-white">
              {createdAt}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Loans List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="card overflow-hidden mt-8"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Pool Loans ({loans.length})
          </h3>
        </div>
        
        {loans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-secondary-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loans.map((loan, index) => (
                  <motion.tr
                    key={loan.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="hover:bg-neutral-50 dark:hover:bg-secondary-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                      {loan.id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {loan.borrower || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                      ${(loan.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-success">
                      {loan.roi || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        loan.status === 'active' 
                          ? 'badge-success' 
                          : 'badge-warning'
                      }`}>
                        {loan.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-neutral-500 dark:text-neutral-400">No loans found in this pool</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PoolDetails; 