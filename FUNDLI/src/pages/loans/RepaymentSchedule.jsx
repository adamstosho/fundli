import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RepaymentSchedule = () => {
  const { user } = useAuth();
  const [repayments, setRepayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({});

  // KYC verification is now optional - all users can view repayment schedule

  useEffect(() => {
    const loadRepayments = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        // For now, we'll show an empty state since repayment API might not be implemented yet
        // This can be updated when the repayment endpoints are ready
        setRepayments([]);
        setSummary({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          nextPayment: null,
          totalPayments: 0,
          completedPayments: 0
        });
      } catch (error) {
        console.error('Error loading repayments:', error);
        setRepayments([]);
        setSummary({});
      } finally {
        setIsLoading(false);
      }
    };

    loadRepayments();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'upcoming':
        return <Clock className="h-5 w-5 text-info" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-error" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'upcoming':
        return 'bg-info/10 text-info border-info/20';
      case 'overdue':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'upcoming':
        return 'Upcoming';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate) < new Date('2024-02-01');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Repayment Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your loan repayments and upcoming payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${summary.totalAmount?.toLocaleString()}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-success">
                ${summary.totalPaid?.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${summary.totalRemaining?.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-info-100 dark:bg-info-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-info-600 dark:text-info-400" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment</p>
              <p className="text-2xl font-bold text-warning">
                ${summary.nextPayment?.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Repayment Progress
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {summary.completedPayments} of {summary.totalPayments} payments completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(summary.completedPayments / summary.totalPayments) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
          <span>0%</span>
          <span>{Math.round((summary.completedPayments / summary.totalPayments) * 100)}%</span>
          <span>100%</span>
        </div>
      </motion.div>

      {/* Next Payment Alert */}
      {summary.nextDueDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="card p-6 mb-8 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            <div>
              <h3 className="font-medium text-warning-900 dark:text-warning-100">
                Next Payment Due
              </h3>
              <p className="text-warning-700 dark:text-warning-300">
                ${summary.nextPayment?.toLocaleString()} due on {new Date(summary.nextDueDate).toLocaleDateString()}
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
        className="card overflow-hidden"
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
              {repayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isOverdue(payment.dueDate) ? 'bg-error/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    ${payment.principal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    ${payment.interest.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    ${payment.remainingBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="card p-6 mt-8 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need Help with Payments?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contact our support team or set up automatic payments
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Setup Auto-Pay
            </button>
            <button className="btn-primary">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepaymentSchedule; 