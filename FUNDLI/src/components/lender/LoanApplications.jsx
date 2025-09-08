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
  TrendingUp
} from 'lucide-react';

const LoanApplications = () => {
  const [loanApplications, setLoanApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentNotes, setInvestmentNotes] = useState('');

  useEffect(() => {
    loadLoanApplications();
  }, []);

  const loadLoanApplications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:5000/api/lender/loan-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLoanApplications(result.data.loanApplications || []);
      } else {
        setError('Failed to load loan applications');
      }
    } catch (error) {
      console.error('Error loading loan applications:', error);
      setError('Failed to load loan applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleInvest = async () => {
    if (!selectedApplication) return;
    
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/lender/loan/${selectedApplication.id}/invest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          investmentAmount: parseFloat(investmentAmount),
          notes: investmentNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowModal(false);
        setSelectedApplication(null);
        setInvestmentAmount('');
        setInvestmentNotes('');
        await loadLoanApplications(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to invest in loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error investing in loan:', error);
      alert('Failed to invest in loan application');
    } finally {
      setIsProcessing(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loan Applications
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage loan applications from borrowers
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {loanApplications.length} total applications
        </div>
      </div>

      {/* Applications List */}
      {loanApplications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Loan Applications
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            There are currently no loan applications to review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loanApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Application Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {application.purpose}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Application #{application.id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(application.kycStatus)}`}>
                      KYC: {application.kycStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6 space-y-4">
                {/* Borrower Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {application.borrower.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {application.borrower.email}
                    </p>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${application.loanAmount?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {application.duration} months
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {application.purpose}
                    </span>
                  </div>
                </div>

                {/* Collateral Info */}
                {application.collateral && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Collateral
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {application.collateral.description || 'No description provided'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleViewDetails(application)}
                  className="w-full px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Loan Application Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Borrower Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Borrower Information</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedApplication.borrower.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedApplication.borrower.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">KYC Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(selectedApplication.kycStatus)}`}>
                      {selectedApplication.kycStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Loan Information</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${selectedApplication.loanAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedApplication.duration} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedApplication.purpose}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedApplication.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collateral Information */}
              {selectedApplication.collateral && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Collateral Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedApplication.collateral.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* Investment Interface */}
              {(selectedApplication.status === 'pending' || selectedApplication.status === 'approved') && (
                <div className="space-y-4">
                  {/* Funding Progress */}
                  {selectedApplication.fundingProgress && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Funding Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Funded:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${selectedApplication.fundingProgress.fundedAmount?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Target:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${(selectedApplication.fundingProgress?.targetAmount || selectedApplication.loanAmount)?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${((selectedApplication.fundingProgress.targetAmount || selectedApplication.loanAmount) - (selectedApplication.fundingProgress.fundedAmount || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round(((selectedApplication.fundingProgress?.fundedAmount || 0) / (selectedApplication.fundingProgress?.targetAmount || selectedApplication.loanAmount)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          {Math.round(((selectedApplication.fundingProgress?.fundedAmount || 0) / (selectedApplication.fundingProgress?.targetAmount || selectedApplication.loanAmount)) * 100)}% funded
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Investment Form */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Investment Amount ($)
                      </label>
                      <input
                        type="number"
                        id="investmentAmount"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="Enter amount to invest"
                        min="1"
                        max={((selectedApplication.fundingProgress?.targetAmount || selectedApplication.loanAmount) - (selectedApplication.fundingProgress?.fundedAmount || 0))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Maximum: ${((selectedApplication.fundingProgress?.targetAmount || selectedApplication.loanAmount) - (selectedApplication.fundingProgress?.fundedAmount || 0)).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="investmentNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Investment Notes (Optional)
                      </label>
                      <textarea
                        id="investmentNotes"
                        value={investmentNotes}
                        onChange={(e) => setInvestmentNotes(e.target.value)}
                        placeholder="Add any notes about this investment..."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <button
                      onClick={handleInvest}
                      disabled={isProcessing || !investmentAmount || parseFloat(investmentAmount) <= 0}
                      className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>{isProcessing ? 'Processing Investment...' : 'Invest in Loan'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;
