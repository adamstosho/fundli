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

      const response = await fetch('https://fundli-hjqn.vercel.app/api/collateral/status', {
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
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-error" />;
      case 'under_review':
      case 'submitted':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 border-success/30 dark:bg-success/20 dark:border-success';
      case 'rejected':
        return 'bg-error/10 border-error/30 dark:bg-error/20 dark:border-error';
      case 'under_review':
      case 'submitted':
        return 'bg-warning/10 border-warning/30 dark:bg-warning/20 dark:border-warning';
      default:
        return 'bg-neutral-50 border-neutral-200 dark:bg-secondary-900/20 dark:border-secondary-800';
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
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-secondary-700">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!verificationStatus) {
    // Show different content based on user type
    if (userType === 'lender') {
      return (
        <div className="bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <h3 className="text-sm font-medium text-secondary-900 dark:text-white">
                Lender Account
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                You can fund loans and manage investments
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-secondary-700">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-neutral-600" />
          <div>
            <h3 className="text-sm font-medium text-secondary-900 dark:text-white">
              Collateral Verification Required
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
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
      className={`bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm border ${getStatusColor(verificationStatus.verificationStatus)}`}
    >
      <div className="flex items-start space-x-3">
        {getStatusIcon(verificationStatus.verificationStatus)}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary-900 dark:text-white">
              {getStatusText(verificationStatus.verificationStatus)}
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDate(verificationStatus.submittedAt)}
            </span>
          </div>
          
          {verificationStatus.verificationStatus === 'approved' && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  Collateral Type: <span className="font-medium capitalize">
                    {verificationStatus.collateralType.replace('_', ' ')}
                  </span>
                </span>
              </div>
              
              {verificationStatus.adminReview?.verifiedValue && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Verified Value: <span className="font-medium">
                      {formatCurrency(verificationStatus.adminReview.verifiedValue)}
                    </span>
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  Verification Date: <span className="font-medium">
                    {formatDate(verificationStatus.adminReview?.reviewedAt)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {verificationStatus.verificationStatus === 'rejected' && verificationStatus.adminReview?.rejectionReason && (
            <div className="mt-2">
              <p className="text-sm text-error dark:text-error/50 mb-3">
                Reason: {verificationStatus.adminReview.rejectionReason}
              </p>
              {userType === 'borrower' && onReapply && (
                <button
                  onClick={onReapply}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Re-apply for Collateral Verification
                </button>
              )}
            </div>
          )}

          {verificationStatus.adminReview?.verificationNotes && (
            <div className="mt-2">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
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
