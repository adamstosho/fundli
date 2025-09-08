import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  CheckCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  User,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';

const InProgressLoansSection = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadInProgressLoans();
  }, []);

  const loadInProgressLoans = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/loans/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter loans that are approved or funded (in progress)
        const inProgressLoans = data.data.loans.filter(loan => 
          ['approved', 'funded'].includes(loan.status)
        );
        setLoans(inProgressLoans);
      } else {
        setError('Failed to load loans');
      }
    } catch (error) {
      console.error('Error loading in-progress loans:', error);
      setError('Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLoan(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'funded':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'funded':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadInProgressLoans}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Loans in Progress
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any loans that are currently in progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
            Loans in Progress
          </h2>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
            {loans.length} Active
          </span>
        </div>

        <div className="space-y-4">
          {loans.map((loan) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {loan.purpose}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(loan.status)}`}>
                      {getStatusIcon(loan.status)}
                      <span className="capitalize">{loan.status}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₦{loan.loanAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {loan.duration} months
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {loan.interestRate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₦{loan.monthlyPayment?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => handleViewDetails(loan)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Loan Details Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Loan Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Loan Status */}
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(selectedLoan.status)}`}>
                    {getStatusIcon(selectedLoan.status)}
                    <span className="capitalize">{selectedLoan.status}</span>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedLoan.status === 'approved' ? 'Approved by lender' : 'Fully funded and disbursed'}
                  </span>
                </div>

                {/* Loan Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Loan Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedLoan.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₦{selectedLoan.loanAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedLoan.duration} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedLoan.interestRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₦{selectedLoan.monthlyPayment?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Repayment:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₦{selectedLoan.totalRepayment?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Applied Date:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedLoan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedLoan.purposeDescription && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedLoan.purposeDescription}</p>
                  </div>
                )}

                {/* Collateral */}
                {selectedLoan.collateral && selectedLoan.collateral.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Collateral</h4>
                    <div className="space-y-2">
                      {selectedLoan.collateral.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white">{item.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Value: ₦{item.value?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default InProgressLoansSection;
