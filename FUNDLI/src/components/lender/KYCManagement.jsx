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
      'kyc_pending': { color: 'bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/50', text: 'KYC Pending' },
      'pending': { color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400', text: 'Pending' },
      'approved': { color: 'bg-success/20 text-success dark:bg-success/20 dark:text-success/50', text: 'Approved' },
      'rejected': { color: 'bg-error/20 text-error dark:bg-error/20 dark:text-error/50', text: 'Rejected' }
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
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success dark:bg-success/20 dark:text-success/50">
          Verified
        </span>
      );
    }

    const statusConfig = {
      'pending': { color: 'bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/50', text: 'Pending' },
      'approved': { color: 'bg-success/20 text-success dark:bg-success/20 dark:text-success/50', text: 'Approved' },
      'rejected': { color: 'bg-error/20 text-error dark:bg-error/20 dark:text-error/50', text: 'Rejected' }
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
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            KYC Management
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Review and manage borrower KYC verifications
          </p>
        </div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning dark:text-warning/50">
              {loanApplications.filter(loan => loan.kycStatus === 'pending').length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Pending KYC</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success dark:text-success/50">
              {loanApplications.filter(loan => loan.kycStatus === 'verified').length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Verified</div>
          </div>
        </div>
      </div>

      {/* Loan Applications Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Loan Applications ({loanApplications.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Loan Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loanApplications.map((loan) => (
                <motion.tr
                  key={loan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-secondary-900 dark:text-white">
                          {loan.borrower.name}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {loan.borrower.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-neutral-400" />
                        <span className="font-medium">${loan.loanAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-400 mt-1">
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
                            className="text-success dark:text-success/50 hover:text-success dark:hover:text-success/40"
                            title="Approve KYC"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setApprovalAction('reject');
                              setShowApprovalModal(true);
                            }}
                            className="text-error dark:text-error/50 hover:text-error dark:hover:text-error/40"
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
            <Shield className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">No loan applications found</p>
          </div>
        )}
      </div>

      {/* KYC Details Modal */}
      {showKYCModal && selectedBorrower && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                KYC Details - {selectedBorrower.firstName} {selectedBorrower.lastName}
              </h3>
              <button
                onClick={() => setShowKYCModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* KYC Status */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">KYC Status</span>
                  {getKYCStatusBadge(selectedBorrower.kycStatus, selectedBorrower.kycVerified)}
                </div>
              </div>

              {/* BVN Information */}
              {selectedBorrower.kycData?.bvn && (
                <div className="border border-neutral-200 dark:border-secondary-700 rounded-lg p-4">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-3">BVN Verification</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">BVN Number:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bvn.number}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bvn.verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Verified At:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
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
                <div className="border border-neutral-200 dark:border-secondary-700 rounded-lg p-4">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Bank Account Verification</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Bank:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.bankName}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Account Number:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.accountNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Account Name:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.accountName}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {selectedBorrower.kycData.bankAccount.verified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Details */}
              {selectedBorrower.kycData?.submittedAt && (
                <div className="border border-neutral-200 dark:border-secondary-700 rounded-lg p-4">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Submission Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Submitted At:</span>
                      <p className="text-secondary-900 dark:text-white font-medium">
                        {new Date(selectedBorrower.kycData.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedBorrower.kycData.reviewedAt && (
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Reviewed At:</span>
                        <p className="text-secondary-900 dark:text-white font-medium">
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
                    className="flex-1 px-4 py-2 bg-success hover:bg-success disabled:bg-success/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
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
                    className="flex-1 px-4 py-2 bg-error hover:bg-error disabled:bg-error/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
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
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                approvalAction === 'approve' 
                  ? 'bg-success/20 dark:bg-success/20' 
                  : 'bg-error/20 dark:bg-error/20'
              }`}>
                {approvalAction === 'approve' ? (
                  <CheckCircle className="h-8 w-8 text-success dark:text-success/50" />
                ) : (
                  <XCircle className="h-8 w-8 text-error dark:text-error/50" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                {approvalAction === 'approve' ? 'Approve KYC' : 'Reject KYC'}
              </h3>
              
              <p className="text-neutral-600 dark:text-neutral-400">
                {approvalAction === 'approve' 
                  ? 'Are you sure you want to approve this borrower\'s KYC verification?' 
                  : 'Are you sure you want to reject this borrower\'s KYC verification?'
                }
              </p>
            </div>

            {approvalAction === 'reject' && (
              <div className="mb-6">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleKYCApproval(approvalAction)}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                  approvalAction === 'approve' 
                    ? 'bg-success hover:bg-success disabled:bg-success/50' 
                    : 'bg-error hover:bg-error disabled:bg-error/50'
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
