import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  User, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Shield,
  CreditCard
} from 'lucide-react';

const PendingLoansSection = ({ userType, title = "Pending Loans" }) => {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingLoans();
  }, [userType]);

  const loadPendingLoans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      let endpoint;
      if (userType === 'borrower') {
        endpoint = 'http://localhost:5000/api/loans/pending/borrower';
      } else if (userType === 'lender' || userType === 'admin') {
        endpoint = 'http://localhost:5000/api/loans/pending/all';
      } else {
        throw new Error('Invalid user type');
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPendingLoans(result.data.loans || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load pending loans');
      }
    } catch (error) {
      console.error('Error loading pending loans:', error);
      setError('Failed to load pending loans');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getKycStatusColor = (kycStatus) => {
    switch (kycStatus) {
      case 'verified': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedLoan(null);
    setShowModal(false);
  };

  const handleRejectLoan = (loan) => {
    setSelectedLoan(loan);
    setShowRejectionModal(true);
    setShowModal(false);
  };

  const handleAcceptLoan = (loan) => {
    // Navigate to payment page
    window.location.href = `/payment/${loan.id}`;
  };

  const handleRejectionSubmit = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/loans/${selectedLoan.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason || 'No reason provided'
        })
      });

      if (response.ok) {
        // Refresh the loans list
        await loadPendingLoans();
        setShowRejectionModal(false);
        setRejectionReason('');
        setSelectedLoan(null);
        alert('Loan application rejected successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to reject loan application');
      }
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Failed to reject loan application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    setSelectedLoan(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {pendingLoans.length} pending
        </div>
      </div>
      
      <div className="space-y-4">
        {pendingLoans.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Pending Loans
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              {userType === 'borrower' 
                ? "You don't have any pending loan applications."
                : "There are currently no pending loan applications."
              }
            </p>
          </div>
        ) : (
          pendingLoans.map((loan, index) => (
            <motion.div
              key={loan.id || loan._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    ${loan.loanAmount?.toLocaleString()}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>
                  {loan.kycStatus && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(loan.kycStatus)}`}>
                      KYC: {loan.kycStatus}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${loan.loanAmount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Remaining
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {loan.purpose}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {loan.duration} months
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(loan.createdAt || loan.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                
                {userType !== 'borrower' && loan.borrower && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-600 dark:text-gray-400">Borrower:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {loan.borrower.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Funding Progress for Lenders and Admins */}
              {userType !== 'borrower' && loan.fundingProgress && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Funding Progress:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(((loan.fundingProgress?.fundedAmount || 0) / (loan.fundingProgress?.targetAmount || loan.loanAmount)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.round(((loan.fundingProgress?.fundedAmount || 0) / (loan.fundingProgress?.targetAmount || loan.loanAmount)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleViewDetails(loan)}
                  className="w-full px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Loan Details Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Loan Application Details
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Borrower Information (for lenders and admins) */}
              {userType !== 'borrower' && selectedLoan.borrower && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Borrower Information
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedLoan.borrower.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedLoan.borrower.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">KYC Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(selectedLoan.borrower.kycStatus)}`}>
                        {selectedLoan.borrower.kycStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Loan Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${selectedLoan.loanAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedLoan.purpose}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                      {selectedLoan.purposeDescription || 'No description provided'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedLoan.duration} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedLoan.interestRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${selectedLoan.monthlyPayment?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Repayment:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${selectedLoan.totalRepayment?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLoan.status)}`}>
                      {selectedLoan.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedLoan.createdAt || selectedLoan.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collateral Information */}
              {selectedLoan.collateral && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Collateral Information
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedLoan.collateral.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Description:</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                        {selectedLoan.collateral.description || 'No description provided'}
                      </span>
                    </div>
                    {selectedLoan.collateral.estimatedValue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Estimated Value:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${selectedLoan.collateral.estimatedValue.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Funding Progress (for lenders and admins) */}
              {userType !== 'borrower' && selectedLoan.fundingProgress && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                    Funding Progress
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Funded Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${selectedLoan.fundingProgress.fundedAmount?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Target Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${(selectedLoan.fundingProgress?.targetAmount || selectedLoan.loanAmount)?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${((selectedLoan.fundingProgress?.targetAmount || selectedLoan.loanAmount) - (selectedLoan.fundingProgress?.fundedAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div 
                          className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.round(((selectedLoan.fundingProgress?.fundedAmount || 0) / (selectedLoan.fundingProgress?.targetAmount || selectedLoan.loanAmount)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(((selectedLoan.fundingProgress?.fundedAmount || 0) / (selectedLoan.fundingProgress?.targetAmount || selectedLoan.loanAmount)) * 100)}% funded
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <div className="flex space-x-3">
                {userType === 'lender' && (
                  <>
                    <button
                      onClick={() => handleRejectLoan(selectedLoan)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleAcceptLoan(selectedLoan)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Accept</span>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reject Loan Application
              </h3>
              <button
                onClick={handleCloseRejectionModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                You are about to reject the loan application for <strong>${selectedLoan.loanAmount?.toLocaleString()}</strong> from <strong>{selectedLoan.borrower?.name}</strong>.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please provide a reason for rejection (optional):
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseRejectionModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectionSubmit}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Reject Application</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default PendingLoansSection;
