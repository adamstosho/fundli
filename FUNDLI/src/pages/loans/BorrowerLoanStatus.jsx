import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  FileText,
  TrendingUp,
  CreditCard,
  ArrowRight,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BorrowerLoanStatus = () => {
  const { user } = useAuth();
  const [loanData, setLoanData] = useState(null);
  const [repaymentHistory, setRepaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLoanData();
  }, []);

  const loadLoanData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch loan data
      const loanResponse = await fetch('http://localhost:5000/api/loans/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (loanResponse.ok) {
        const loanData = await loanResponse.json();
        console.log('📊 Loan data:', loanData);
        
        // Get the most recent active loan
        const activeLoan = loanData.data?.loans?.find(loan => 
          ['active', 'funded', 'disbursed'].includes(loan.status)
        ) || loanData.data?.loans?.[0];
        
        setLoanData(activeLoan);
        
        // Load repayment history for this loan
        if (activeLoan) {
          await loadRepaymentHistory(activeLoan._id, token);
        }
      } else {
        const errorData = await loanResponse.json();
        throw new Error(errorData.message || 'Failed to load loan data');
      }
    } catch (error) {
      console.error('❌ Error loading loan data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRepaymentHistory = async (loanId, token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/repayments/loan/${loanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRepaymentHistory(data.data?.repayments || []);
      }
    } catch (error) {
      console.error('❌ Error loading repayment history:', error);
      // Don't set error here as it's not critical
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: CheckCircle, text: 'Approved' },
      disbursed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle, text: 'Disbursed' },
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle, text: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: CheckCircle, text: 'Completed' },
      overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertTriangle, text: 'Overdue' },
      defaulted: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle, text: 'Defaulted' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'text-gray-600 dark:text-gray-400';
    
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'text-red-600 dark:text-red-400'; // Overdue
    if (daysUntilDue <= 7) return 'text-yellow-600 dark:text-yellow-400'; // Due soon
    return 'text-green-600 dark:text-green-400'; // On track
  };

  const calculateProgress = () => {
    if (!loanData) return 0;
    
    const totalAmount = loanData.loanAmount || 0;
    const paidAmount = loanData.amountPaid || 0;
    
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  };

  const downloadLoanAgreement = () => {
    // This would typically generate or fetch the loan agreement PDF
    console.log('Downloading loan agreement for loan:', loanData?._id);
    // For now, we'll just show an alert
    alert('Loan agreement download would be implemented here');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading loan status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Loan Status</h3>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              <button 
                onClick={loadLoanData}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1 inline" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loanData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Loan Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have any active loans at the moment.
          </p>
          <button className="btn-primary">
            <ArrowRight className="h-4 w-4 mr-2" />
            Apply for a Loan
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const installmentsPaid = Math.floor(progress / (100 / (loanData.duration || 12)));
  const totalInstallments = loanData.duration || 12;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Loan Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your loan progress and repayment details
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          {getStatusBadge(loanData.status)}
        </div>
      </div>

      {/* Core Loan Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
          Core Loan Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loan Amount Approved</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${loanData.loanAmount?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disbursed Amount</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${loanData.disbursedAmount?.toLocaleString() || loanData.loanAmount?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Balance</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${((loanData.loanAmount || 0) - (loanData.amountPaid || 0)).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Repayment</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${loanData.monthlyPayment?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Due Date</p>
            <p className={`text-lg font-semibold ${getDueDateColor(loanData.nextPaymentDate)}`}>
              {loanData.nextPaymentDate ? new Date(loanData.nextPaymentDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loan Term</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {loanData.duration || 12} months
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interest Rate</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {loanData.interestRate || 0}%
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Purpose</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {loanData.purpose || 'N/A'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Loan Status Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
          Loan Status Indicators
        </h2>
        
        <div className="space-y-6">
          {/* Repayment Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Repayment Progress</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>${loanData.amountPaid?.toLocaleString() || '0'} paid</span>
              <span>${((loanData.loanAmount || 0) - (loanData.amountPaid || 0)).toLocaleString()} remaining</span>
            </div>
          </div>

          {/* Installments Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Installments Progress</p>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(installmentsPaid / totalInstallments) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {installmentsPaid} of {totalInstallments}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Until Next Payment</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {loanData.nextPaymentDate ? 
                  Math.ceil((new Date(loanData.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
                  'N/A'
                } days
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Repayment History & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Repayment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary-600" />
            Repayment History
          </h2>
          
          {repaymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {repaymentHistory.map((payment, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                        ${payment.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'successful' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {payment.status === 'successful' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Successful
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {payment.paymentMethod || 'Bank Transfer'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Repayment History
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your repayment history will appear here once you start making payments.
              </p>
            </div>
          )}
        </motion.div>

        {/* Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-600" />
            Documents
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={downloadLoanAgreement}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Loan Agreement</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download contract</p>
                </div>
              </div>
              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={() => console.log('Download repayment schedule')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Repayment Schedule</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View payment plan</p>
                </div>
              </div>
              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BorrowerLoanStatus;
