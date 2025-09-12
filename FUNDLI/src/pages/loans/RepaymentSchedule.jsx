import { useState, useEffect } from 'react';
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
      const response = await fetch('http://localhost:5000/api/loans/repayment-schedule', {
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
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status, dueDate) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'pending';
    
    if (isOverdue) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    }
    
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
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
    if (!dueDate) return { status: 'unknown', color: 'text-gray-600 dark:text-gray-400' };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600 dark:text-red-400' };
    if (diffDays <= 7) return { status: 'upcoming', color: 'text-yellow-600 dark:text-yellow-400' };
    return { status: 'ontrack', color: 'text-green-600 dark:text-green-400' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading repayment schedule...</p>
        </div>
      </div>
    );
  }

  if (error && repayments.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
        
        {/* Show apply for loan option if no loans found */}
        {error.includes('No active loans found') && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Repayment Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your loan repayments and upcoming payments
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={loadRepayments}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(summary.totalAmount || 0).toLocaleString()}
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${(summary.paidAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${(summary.nextPayment || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Repayment Progress
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {summary.completedPayments || 0} of {summary.totalPayments || 0} payments completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${summary.totalPayments ? (summary.completedPayments / summary.totalPayments) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
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
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                Next Payment Due
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Schedule
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Interest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Remaining Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {repayments.length > 0 ? (
                repayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isOverdue(payment.dueDate) && payment.status === 'pending' ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {payment.installmentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${(payment.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      ${(payment.principal || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      ${(payment.interest || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
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
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No repayment schedule available</p>
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
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need Help with Payments?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
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