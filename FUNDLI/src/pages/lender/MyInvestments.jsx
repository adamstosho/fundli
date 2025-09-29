import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  User, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Target,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MyInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'active', 'repaid'
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    repaidInvestments: 0,
    totalReturns: 0,
    averageROI: 0
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔍 Loading funded loans for lender:', user?.email);

      const response = await fetch(buildApiUrl('/lender/funded-loans'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Funded loans loaded:', result);
        
        const fundedLoans = result.data?.fundedLoans || [];
        
        // Separate funded loans and repaid loans
        const activeLoans = fundedLoans.filter(loan => 
          loan.status === 'active' || loan.status === 'funded' || loan.status === 'approved'
        );
        const repaidLoans = fundedLoans.filter(loan => 
          loan.status === 'completed' || loan.status === 'repaid'
        );
        
        // Combine both types for display
        const allInvestments = [...activeLoans, ...repaidLoans];
        setInvestments(allInvestments);

        // Use backend-provided stats or calculate if not available
        const totalInvested = result.data?.totalFunded || fundedLoans.reduce((sum, loan) => sum + (loan.fundedAmount || 0), 0);
        const activeInvestments = result.data?.activeInvestments || activeLoans.length;
        const repaidInvestments = result.data?.repaidInvestments || repaidLoans.length;
        const totalReturns = result.data?.totalReturns || fundedLoans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
        const averageROI = fundedLoans.length > 0 
          ? fundedLoans.reduce((sum, loan) => sum + (loan.interestRate || 0), 0) / fundedLoans.length 
          : 0;

        setStats({
          totalInvested,
          activeInvestments,
          repaidInvestments,
          totalReturns,
          averageROI: parseFloat(averageROI.toFixed(1))
        });

      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load investments');
      }
    } catch (error) {
      console.error('Error loading investments:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (investment) => {
    setSelectedInvestment(investment);
    setShowDetailsModal(true);
  };

  const getFilteredInvestments = () => {
    if (filterType === 'active') {
      return investments.filter(loan => 
        loan.status === 'active' || loan.status === 'funded' || loan.status === 'approved'
      );
    } else if (filterType === 'repaid') {
      return investments.filter(loan => 
        loan.status === 'completed' || loan.status === 'repaid'
      );
    }
    return investments;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'funded':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'completed':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400';
      case 'defaulted':
        return 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
    }
  };

  const calculateDaysUntilDue = (endDate) => {
    if (!endDate) return 'N/A';
    const today = new Date();
    const dueDate = new Date(endDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Overdue';
  };

  const calculateDueDate = (fundedAt, duration) => {
    if (!fundedAt || !duration) return null;
    const fundedDate = new Date(fundedAt);
    const dueDate = new Date(fundedDate);
    dueDate.setMonth(dueDate.getMonth() + duration);
    return dueDate;
  };

  const calculateProgressPercentage = (amountPaid, totalRepayment) => {
    if (!totalRepayment || totalRepayment === 0) return 0;
    return Math.round((amountPaid / totalRepayment) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          My Investments
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Track your funded loans and monitor repayment progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Total Invested
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                ₦{stats.totalInvested.toLocaleString()}
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
                Active Investments
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.activeInvestments}
              </p>
            </div>
            <div className="w-12 h-12 bg-success/20 dark:bg-success/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success dark:text-success/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Repaid Loans
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.repaidInvestments}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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
                Total Returns
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                ₦{stats.totalReturns.toLocaleString()}
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
          transition={{ duration: 0.6, delay: 0.35 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Average ROI
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.averageROI}%
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-secondary-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-secondary-700 hover:bg-neutral-50 dark:hover:bg-secondary-700'
          }`}
        >
          All Investments ({investments.length})
        </button>
        <button
          onClick={() => setFilterType('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-secondary-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-secondary-700 hover:bg-neutral-50 dark:hover:bg-secondary-700'
          }`}
        >
          Active ({stats.activeInvestments})
        </button>
        <button
          onClick={() => setFilterType('repaid')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'repaid'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-secondary-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-secondary-700 hover:bg-neutral-50 dark:hover:bg-secondary-700'
          }`}
        >
          Repaid ({stats.repaidInvestments})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm font-medium text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Investments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredInvestments().map((investment, index) => (
          <motion.div
            key={investment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Investment Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-secondary-700">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {investment.purpose}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                  {investment.status}
                </span>
              </div>
              
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                Borrower: {investment.borrower?.name || 'Unknown'}
              </p>
            </div>

            {/* Investment Details */}
            <div className="p-6 space-y-4">
              {/* Amount and Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Invested Amount</span>
                  <span className="text-lg font-bold text-secondary-900 dark:text-white">
                    ₦{investment.fundedAmount?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Repayment</span>
                  <span className="text-sm font-medium text-secondary-900 dark:text-white">
                    ₦{investment.totalRepayment?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Amount Paid</span>
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    ₦{investment.amountPaid?.toLocaleString() || '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-t border-neutral-200 dark:border-secondary-700 pt-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Progress</span>
                  <span className="text-sm font-bold text-secondary-900 dark:text-white">
                    {calculateProgressPercentage(investment.amountPaid, investment.totalRepayment)}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-neutral-200 dark:bg-secondary-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgressPercentage(investment.amountPaid, investment.totalRepayment)}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-success dark:text-success/50" />
                  <span className="text-neutral-600 dark:text-neutral-400">Interest:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">{investment.interestRate || 0}%</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">{investment.duration || 0} months</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-neutral-600 dark:text-neutral-400">Applied:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {investment.createdAt ? new Date(investment.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-neutral-600 dark:text-neutral-400">Due Date:</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {(() => {
                      const dueDate = investment.endDate || calculateDueDate(investment.fundedAt, investment.duration);
                      return dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0">
              <button
                onClick={() => handleViewDetails(investment)}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Details</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Investments Message */}
      {getFilteredInvestments().length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
            {filterType === 'active' ? 'No Active Investments' : 
             filterType === 'repaid' ? 'No Repaid Loans' : 
             'No Investments Yet'}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            {filterType === 'active' ? 'You don\'t have any active investments at the moment.' : 
             filterType === 'repaid' ? 'You don\'t have any repaid loans yet.' : 
             'You haven\'t funded any loans yet. Start investing to see your portfolio here.'}
          </p>
          <button
            onClick={() => window.location.href = '/marketplace/browse'}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Browse Loans</span>
          </button>
        </div>
      )}

      {/* Investment Details Modal */}
      {showDetailsModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Investment Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Investment Summary */}
              <div className="bg-neutral-50 dark:bg-secondary-900 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Investment Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Purpose:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedInvestment.purpose}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Borrower:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedInvestment.borrower?.name}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Invested Amount:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">₦{selectedInvestment.fundedAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Interest Rate:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedInvestment.interestRate}%</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                    <p className="font-medium text-secondary-900 dark:text-white">{selectedInvestment.duration} months</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvestment.status)}`}>
                      {selectedInvestment.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Repayment Information */}
              <div className="bg-neutral-50 dark:bg-secondary-900 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Repayment Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Repayment Amount:</span>
                    <span className="font-bold text-lg text-secondary-900 dark:text-white">
                      ₦{selectedInvestment.totalRepayment?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Amount Paid:</span>
                    <span className="font-medium text-success-600 dark:text-success-400">
                      ₦{selectedInvestment.amountPaid?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Amount Remaining:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      ₦{(selectedInvestment.totalRepayment - (selectedInvestment.amountPaid || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Due Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {(() => {
                        const dueDate = selectedInvestment.endDate || calculateDueDate(selectedInvestment.fundedAt, selectedInvestment.duration);
                        return dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Repayment Progress</span>
                    <span className="text-sm font-medium text-secondary-900 dark:text-white">
                      {calculateProgressPercentage(selectedInvestment.amountPaid, selectedInvestment.totalRepayment)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-secondary-700 rounded-full h-3">
                    <div 
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgressPercentage(selectedInvestment.amountPaid, selectedInvestment.totalRepayment)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-neutral-50 dark:bg-secondary-900 rounded-lg p-4">
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Investment Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Application Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedInvestment.createdAt ? new Date(selectedInvestment.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Funded Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedInvestment.fundedAt ? new Date(selectedInvestment.fundedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Due Date:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {(() => {
                        const dueDate = selectedInvestment.endDate || calculateDueDate(selectedInvestment.fundedAt, selectedInvestment.duration);
                        return dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvestments;
