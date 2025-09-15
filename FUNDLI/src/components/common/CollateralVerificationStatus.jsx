import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';

const CollateralVerificationStatus = ({ userId, userType = 'borrower', onReapply }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerificationStatus();
  }, [userId]);

  const loadVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) return;

      // Only load collateral status for borrowers
      if (userType !== 'borrower') {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/collateral/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.data.collateral);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under_review':
      case 'submitted':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'under_review':
      case 'submitted':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Collateral Verified';
      case 'rejected':
        return 'Collateral Rejected';
      case 'under_review':
        return 'Under Review';
      case 'submitted':
        return 'Submitted for Review';
      default:
        return 'Verification Required';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!verificationStatus) {
    // Show different content based on user type
    if (userType === 'lender') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Lender Account
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can fund loans and manage investments
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Collateral Verification Required
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Complete collateral verification to proceed with loan applications
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border ${getStatusColor(verificationStatus.verificationStatus)}`}
    >
      <div className="flex items-start space-x-3">
        {getStatusIcon(verificationStatus.verificationStatus)}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {getStatusText(verificationStatus.verificationStatus)}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(verificationStatus.submittedAt)}
            </span>
          </div>
          
          {verificationStatus.verificationStatus === 'approved' && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Collateral Type: <span className="font-medium capitalize">
                    {verificationStatus.collateralType.replace('_', ' ')}
                  </span>
                </span>
              </div>
              
              {verificationStatus.adminReview?.verifiedValue && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Verified Value: <span className="font-medium">
                      {formatCurrency(verificationStatus.adminReview.verifiedValue)}
                    </span>
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Verification Date: <span className="font-medium">
                    {formatDate(verificationStatus.adminReview?.reviewedAt)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {verificationStatus.verificationStatus === 'rejected' && verificationStatus.adminReview?.rejectionReason && (
            <div className="mt-2">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                Reason: {verificationStatus.adminReview.rejectionReason}
              </p>
              {userType === 'borrower' && onReapply && (
                <button
                  onClick={onReapply}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Re-apply for Collateral Verification
                </button>
              )}
            </div>
          )}

          {verificationStatus.adminReview?.verificationNotes && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {verificationStatus.adminReview.verificationNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CollateralVerificationStatus;
