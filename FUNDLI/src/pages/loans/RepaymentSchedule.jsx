import { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/config';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  CreditCard, 
  Shield,
  RefreshCw,
  FileText,
  Download,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RepaymentSchedule = () => {
  const { user } = useAuth();
  const [repayments, setRepayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadRepayments();
  }, [user]);

  const loadRepayments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('🔍 Loading repayment schedule...');
      
      // Fetch repayment schedule from API
      const response = await fetch(buildApiUrl('/loans/repayment-schedule'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Repayment schedule data:', data);
        
        setRepayments(data.data.repaymentSchedule || []);
        setSummary({
          totalAmount: data.data.totalAmount,
          paidAmount: data.data.paidAmount,
          remainingAmount: data.data.remainingAmount,
          nextPayment: data.data.nextPayment?.amount,
          nextDueDate: data.data.nextPayment?.dueDate,
          totalPayments: data.data.totalPayments,
          completedPayments: data.data.completedPayments,
          loanAmount: data.data.loanAmount,
          monthlyPayment: data.data.monthlyPayment,
          interestRate: data.data.interestRate,
          duration: data.data.duration
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load repayment schedule');
      }
    } catch (error) {
      console.error('❌ Error loading repayments:', error);
      setError(error.message);
      
      // Clear data on error - no mock data
      setRepayments([]);
      setSummary({
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        nextPayment: 0,
        nextDueDate: null,
        totalPayments: 0,
        completedPayments: 0,
        loanAmount: 0,
        monthlyPayment: 0,
        interestRate: 0,
        duration: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status, dueDate) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'pending';
    
    if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-error" />;
    }
    
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-primary-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-error" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getStatusColor = (status, dueDate) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'pending';
    
    if (isOverdue) {
      return 'bg-error/20 text-error border-error/30 dark:bg-error/20 dark:text-error/50 dark:border-error';
    }
    
    switch (status) {
      case 'paid':
        return 'bg-success/20 text-success border-success/30 dark:bg-success/20 dark:text-success/50 dark:border-success';
      case 'pending':
        return 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800';
      case 'overdue':
        return 'bg-error/20 text-error border-error/30 dark:bg-error/20 dark:text-error/50 dark:border-error';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-secondary-800 dark:text-neutral-400 dark:border-secondary-700';
    }
  };

  const getStatusText = (status, dueDate) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'pending';
    
    if (isOverdue) {
      return 'Overdue';
    }
    
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Upcoming';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { status: 'unknown', color: 'text-neutral-600 dark:text-neutral-400' };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', color: 'text-error dark:text-error/50' };
    if (diffDays <= 7) return { status: 'upcoming', color: 'text-warning dark:text-warning/50' };
    return { status: 'ontrack', color: 'text-success dark:text-success/50' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading repayment schedule...</p>
        </div>
      </div>
    );
  }

  if (error && repayments.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-2" />
            <span className="text-error dark:text-error/30">{error}</span>
          </div>
        </div>
        
        {/* Show apply for loan option if no loans found */}
        {error.includes('No active loans found') && (
          <div className="mt-6 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              You don't have any active loans yet.
            </p>
            <a href="/loans/apply" className="btn-primary">
              Apply for a Loan
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Repayment Schedule
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Track your loan repayments and upcoming payments
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={loadRepayments}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button className="btn-outline flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Schedule</span>
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
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-2" />
            <span className="text-error dark:text-error/30">
              Failed to load repayment data: {error}
            </span>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Loan</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                ${(summary.totalAmount || 0).toLocaleString()}
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
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Paid</p>
              <p className="text-2xl font-bold text-success dark:text-success/50">
                ${(summary.paidAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success/20 dark:bg-success/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success dark:text-success/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Remaining</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${(summary.remainingAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-neutral-200 dark:border-secondary-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Next Payment</p>
              <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                ${(summary.nextPayment || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-neutral-200 dark:border-secondary-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Repayment Progress
          </h3>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {summary.completedPayments || 0} of {summary.totalPayments || 0} payments completed
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${summary.totalPayments ? (summary.completedPayments / summary.totalPayments) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          <span>0%</span>
          <span>{summary.totalPayments ? Math.round((summary.completedPayments / summary.totalPayments) * 100) : 0}%</span>
          <span>100%</span>
        </div>
      </motion.div>

      {/* Next Payment Alert */}
      {summary.nextDueDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning rounded-xl p-6"
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-warning dark:text-warning/50" />
            <div>
              <h3 className="font-medium text-warning dark:text-warning/20">
                Next Payment Due
              </h3>
              <p className="text-warning dark:text-warning/40">
                ${(summary.nextPayment || 0).toLocaleString()} due on {summary.nextDueDate ? new Date(summary.nextDueDate).toLocaleDateString() : 'TBD'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Repayment Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-neutral-200 dark:border-secondary-700 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Payment Schedule
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-secondary-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Payment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Interest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Remaining Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-gray-700">
              {repayments.length > 0 ? (
                repayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className={`hover:bg-neutral-50 dark:hover:bg-secondary-800 ${
                      isOverdue(payment.dueDate) && payment.status === 'pending' ? 'bg-error/10 dark:bg-error/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                      {payment.installmentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-white">
                      ${(payment.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      ${(payment.principal || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      ${(payment.interest || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      ${(payment.remainingBalance || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status, payment.dueDate)}`}>
                        {getStatusIcon(payment.status, payment.dueDate)}
                        <span className="ml-1">{getStatusText(payment.status, payment.dueDate)}</span>
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-600 dark:text-neutral-400">No repayment schedule available</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              Need Help with Payments?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Contact our support team or set up automatic payments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 lg:mt-0">
            <button className="btn-outline flex items-center justify-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Setup Auto-Pay</span>
            </button>
            <button className="btn-primary flex items-center justify-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RepaymentSchedule; 