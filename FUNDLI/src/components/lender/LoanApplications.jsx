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
  MessageSquare,
  Send,
  Trash2,
  Bell,
  CreditCard
} from 'lucide-react';
import PaymentModal from './PaymentModal';

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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'accept' or 'reject'
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);

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

  const handleAcceptLoan = async () => {
    if (!selectedApplication) return;

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      // First, accept the loan application
      const response = await fetch(`http://localhost:5000/api/lender/loan/${selectedApplication.id}/accept`, {
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
        
        alert(`Successfully funded loan! $${investmentAmount} has been transferred to ${selectedApplication.borrower.name}.`);
        
        // Clear form data
        setShowAcceptModal(false);
        setSelectedApplication(null);
        setInvestmentAmount('');
        setInvestmentNotes('');
        
        // Refresh loan applications
        await loadLoanApplications();
        
        // Refresh lender dashboard to update Total Invested card and wallet balance
        if (window.refreshLenderDashboard) {
          window.refreshLenderDashboard();
        }
        
        // Also refresh wallet balance specifically
        if (window.refreshWalletBalance) {
          window.refreshWalletBalance();
        }
        
        // Trigger wallet balance update event
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated'));
      } else {
        const errorData = await response.json();
        alert(`Failed to fund loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error accepting loan:', error);
      alert('Failed to accept loan application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectLoan = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/lender/loan/${selectedApplication.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create notifications for borrower and admin
        await createRejectionNotifications(result.data);
        
        alert(result.message);
        setShowModal(false);
        setShowRejectModal(false);
        setSelectedApplication(null);
        setRejectionReason('');
        
        // Refresh loan applications - rejected loan will be removed automatically
        await loadLoanApplications();
      } else {
        const errorData = await response.json();
        alert(`Failed to reject loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Failed to reject loan application');
    } finally {
      setIsProcessing(false);
    }
  };

  const createRejectionNotifications = async (rejectionData) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Create notification for borrower
      const borrowerNotification = {
        userId: selectedApplication.borrower.id,
        type: 'loan_rejected',
        title: 'Loan Application Rejected',
        message: `Your loan application for $${selectedApplication.loanAmount?.toLocaleString()} has been rejected. Please review the reason and consider applying again.`,
        metadata: {
          loanId: selectedApplication.id,
          amount: selectedApplication.loanAmount,
          lenderName: 'Lender', // You can get this from user context
          reason: rejectionReason.trim(),
          purpose: selectedApplication.purpose
        }
      };

      // Create notification for admin
      const adminNotification = {
        userId: 'admin', // You might need to get admin ID from context
        type: 'loan_rejected',
        title: 'Loan Application Rejected',
        message: `A loan application for $${selectedApplication.loanAmount?.toLocaleString()} has been rejected by a lender.`,
        metadata: {
          loanId: selectedApplication.id,
          amount: selectedApplication.loanAmount,
          lenderName: 'Lender',
          borrowerName: selectedApplication.borrower.name,
          reason: rejectionReason.trim(),
          purpose: selectedApplication.purpose
        }
      };

      // Try to send notifications to backend, but don't fail if it doesn't work
      try {
        // Send borrower notification
        const borrowerResponse = await fetch('http://localhost:5000/api/notifications/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(borrowerNotification)
        });

        if (!borrowerResponse.ok) {
          console.log('Backend notification API not available, storing locally');
          storeNotificationLocally(borrowerNotification);
        }

        // Send admin notification
        const adminResponse = await fetch('http://localhost:5000/api/notifications/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(adminNotification)
        });

        if (!adminResponse.ok) {
          console.log('Backend notification API not available, storing locally');
          storeNotificationLocally(adminNotification);
        }

      } catch (apiError) {
        console.log('Backend notification API not available, storing locally');
        // Store notifications locally as fallback
        storeNotificationLocally(borrowerNotification);
        storeNotificationLocally(adminNotification);
      }

    } catch (error) {
      console.error('Error creating rejection notifications:', error);
      // Don't fail the rejection if notifications fail
    }
  };

  const storeNotificationLocally = (notification) => {
    try {
      const existingNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const newNotification = {
        ...notification,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      existingNotifications.unshift(newNotification);
      
      // Keep only last 50 notifications
      if (existingNotifications.length > 50) {
        existingNotifications.splice(50);
      }
      
      localStorage.setItem('localNotifications', JSON.stringify(existingNotifications));
      
      // Trigger a custom event to notify the notification dropdown
      window.dispatchEvent(new CustomEvent('notificationAdded', { 
        detail: newNotification 
      }));
      
    } catch (error) {
      console.error('Error storing notification locally:', error);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    // Payment was successful, refresh loan applications
    loadLoanApplications();
    
    // Show success message
    alert(`Payment successful! ${paymentData.amount} has been transferred to the borrower.`);
  };

  const handleActionClick = (application, action) => {
    setSelectedApplication(application);
    setActionType(action);
    if (action === 'accept') {
      setShowAcceptModal(true);
    } else if (action === 'reject') {
      setShowRejectModal(true);
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
            Approved Loan Applications
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fund approved loan applications that are ready for investment
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {loanApplications.length} approved applications
        </div>
      </div>

      {/* Applications List */}
      {loanApplications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Approved Loan Applications
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No loan applications are currently approved and ready for funding. Check back later for new opportunities.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-2 mb-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Stay Updated</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You'll be notified when new loan applications are approved and ready for funding.
            </p>
          </div>
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
              <div className="p-6 pt-0 space-y-3">
                <button
                  onClick={() => handleViewDetails(application)}
                  className="w-full px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                
                {application.status === 'approved' && (
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActionClick(application, 'accept')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Fund Loan</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActionClick(application, 'reject')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </motion.button>
                  </div>
                )}
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
      {/* Accept Loan Modal */}
      {showAcceptModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Fund Loan Application
              </h3>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Borrower:</strong> {selectedApplication.borrower.name}<br/>
                  <strong>Amount:</strong> ${selectedApplication.loanAmount?.toLocaleString()}<br/>
                  <strong>Purpose:</strong> {selectedApplication.purpose}
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Funding Process</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  After funding, the borrower will receive the funds in their account balance and you'll be notified of the successful transaction.
                </p>
              </div>
              
              <div>
                <label htmlFor="acceptAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investment Amount ($)
                </label>
                <input
                  type="number"
                  id="acceptAmount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount to invest"
                  min="1"
                  max={selectedApplication.loanAmount}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label htmlFor="acceptNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="acceptNotes"
                  value={investmentNotes}
                  onChange={(e) => setInvestmentNotes(e.target.value)}
                  placeholder="Add any notes about this investment..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptLoan}
                  disabled={isProcessing || !investmentAmount || parseFloat(investmentAmount) <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isProcessing ? 'Funding...' : 'Fund Loan'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Loan Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                Reject Loan Application
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Borrower:</strong> {selectedApplication.borrower.name}<br/>
                  <strong>Amount:</strong> ${selectedApplication.loanAmount?.toLocaleString()}<br/>
                  <strong>Purpose:</strong> {selectedApplication.purpose}
                </p>
              </div>
              
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this loan application..."
                  rows="4"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This reason will be sent to the borrower as a notification.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectLoan}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{isProcessing ? 'Rejecting...' : 'Reject Loan'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedLoanForPayment(null);
        }}
        loanApplication={selectedLoanForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default LoanApplications;