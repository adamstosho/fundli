import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  AlertCircle,
  User,
  DollarSign,
  Calendar
} from 'lucide-react';

const KYCManagement = () => {
  const [loanApplications, setLoanApplications] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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
        console.error('Failed to load loan applications');
      }
    } catch (error) {
      console.error('Error loading loan applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const viewBorrowerKYC = async (borrowerId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/lender/borrower/${borrowerId}/kyc`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedBorrower(result.data.borrower);
        setShowKYCModal(true);
      } else {
        console.error('Failed to load borrower KYC');
      }
    } catch (error) {
      console.error('Error loading borrower KYC:', error);
    }
  };

  const handleKYCApproval = async (action) => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/lender/borrower/${selectedBorrower.id}/kyc/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        
        // Refresh loan applications
        await loadLoanApplications();
        
        // Close modals
        setShowKYCModal(false);
        setShowApprovalModal(false);
        setSelectedBorrower(null);
        setRejectionReason('');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error processing KYC approval:', error);
      alert('Failed to process KYC approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'kyc_pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', text: 'KYC Pending' },
      'pending': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', text: 'Pending' },
      'approved': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Approved' },
      'rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getKYCStatusBadge = (kycStatus, kycVerified) => {
    if (kycVerified) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Verified
        </span>
      );
    }

    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', text: 'Pending' },
      'approved': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Approved' },
      'rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Rejected' }
    };

    const config = statusConfig[kycStatus] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            KYC Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and manage borrower KYC verifications
          </p>
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {loanApplications.filter(loan => loan.kycStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending KYC</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {loanApplications.filter(loan => loan.kycStatus === 'verified').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
          </div>
        </div>
      </div>

      {/* Loan Applications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Loan Applications ({loanApplications.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Loan Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loanApplications.map((loan) => (
                <motion.tr
                  key={loan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {loan.borrower.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {loan.borrower.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">${loan.loanAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                        {loan.purpose} • {loan.duration} months
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getKYCStatusBadge(loan.borrower.kycStatus, loan.borrower.kycVerified)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(loan.status)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewBorrowerKYC(loan.borrower.id)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        title="View KYC Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {loan.borrower.kycStatus === 'pending' && loan.borrower.hasKycData && (
                        <>
                          <button
                            onClick={() => {
                              setApprovalAction('approve');
                              setShowApprovalModal(true);
                            }}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                            title="Approve KYC"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setApprovalAction('reject');
                              setShowApprovalModal(true);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            title="Reject KYC"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loanApplications.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No loan applications found</p>
          </div>
        )}
      </div>

      {/* KYC Details Modal */}
      {showKYCModal && selectedBorrower && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                KYC Details - {selectedBorrower.firstName} {selectedBorrower.lastName}
              </h3>
              <button
                onClick={() => setShowKYCModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* KYC Status */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">KYC Status</span>
                  {getKYCStatusBadge(selectedBorrower.kycStatus, selectedBorrower.kycVerified)}
                </div>
              </div>

              {/* BVN Information */}
              {selectedBorrower.kycData?.bvn && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">BVN Verification</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">BVN Number:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bvn.number}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bvn.verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Verified At:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bvn.verifiedAt ? 
                          new Date(selectedBorrower.kycData.bvn.verifiedAt).toLocaleDateString() : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Account Information */}
              {selectedBorrower.kycData?.bankAccount && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Bank Account Verification</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Bank:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.bankName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Account Number:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.accountNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Account Name:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.accountName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Details */}
              {selectedBorrower.kycData?.submittedAt && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Submission Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submitted At:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(selectedBorrower.kycData.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedBorrower.kycData.reviewedAt && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Reviewed At:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {new Date(selectedBorrower.kycData.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedBorrower.kycStatus === 'pending' && selectedBorrower.kycData?.submittedAt && (
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setApprovalAction('approve');
                      setShowApprovalModal(true);
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve KYC
                  </button>
                  
                  <button
                    onClick={() => {
                      setApprovalAction('reject');
                      setShowApprovalModal(true);
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject KYC
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                approvalAction === 'approve' 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {approvalAction === 'approve' ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {approvalAction === 'approve' ? 'Approve KYC' : 'Reject KYC'}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400">
                {approvalAction === 'approve' 
                  ? 'Are you sure you want to approve this borrower\'s KYC verification?' 
                  : 'Are you sure you want to reject this borrower\'s KYC verification?'
                }
              </p>
            </div>

            {approvalAction === 'reject' && (
              <div className="mb-6">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleKYCApproval(approvalAction)}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  approvalAction === 'approve' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
