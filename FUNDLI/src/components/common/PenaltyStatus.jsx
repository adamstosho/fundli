import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Info
} from 'lucide-react';
import { buildApiUrl } from '../../utils/config';

const PenaltyStatus = ({ loanId, onUpdate }) => {
  const [penaltyData, setPenaltyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPenaltyStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl(`/borrower/loan/${loanId}/penalty-status`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPenaltyData(data.data);
        setLastUpdated(new Date());
        
        // Notify parent component of update
        if (onUpdate) {
          onUpdate(data.data);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch penalty status');
      }
    } catch (error) {
      console.error('Error fetching penalty status:', error);
      setError('Failed to fetch penalty status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPenaltyStatus();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchPenaltyStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loanId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLate = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
          <span className="text-neutral-600 dark:text-neutral-400">Loading penalty status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
        <div className="flex items-center text-error">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!penaltyData) {
    return null;
  }

  const { penaltyStatus, totalPenaltyCharges, nextPaymentDate } = penaltyData;
  const hasPenalties = penaltyStatus.hasPendingPenalties;
  const totalRepayment = penaltyStatus.totalRepaymentAmount;

  // Only show the component if there are actual penalties
  if (!hasPenalties || totalPenaltyCharges === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
            hasPenalties 
              ? 'bg-warning-100 dark:bg-warning-900/20' 
              : 'bg-success-100 dark:bg-success-900/20'
          }`}>
            {hasPenalties ? (
              <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            ) : (
              <Clock className="h-5 w-5 text-success-600 dark:text-success-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Penalty Status
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {hasPenalties ? 'Late payment penalties applied' : 'No penalties applied'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchPenaltyStatus}
          className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          title="Refresh penalty status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Penalty Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-neutral-50 dark:bg-secondary-700 rounded-lg">
          <div className="text-2xl font-bold text-secondary-900 dark:text-white">
            {formatCurrency(penaltyData.loanAmount)}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Original Loan Amount
          </div>
        </div>
        
        <div className={`text-center p-4 rounded-lg ${
          hasPenalties 
            ? 'bg-warning-50 dark:bg-warning-900/20' 
            : 'bg-success-50 dark:bg-success-900/20'
        }`}>
          <div className={`text-2xl font-bold ${
            hasPenalties 
              ? 'text-warning-600 dark:text-warning-400' 
              : 'text-success-600 dark:text-success-400'
          }`}>
            {formatCurrency(totalPenaltyCharges)}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Penalty Charges
          </div>
        </div>
        
        <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totalRepayment)}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Total Due
          </div>
        </div>
      </div>

      {/* Penalty Details */}
      {hasPenalties && penaltyStatus.repayments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
            Penalty Breakdown
          </h4>
          <div className="space-y-3">
            {penaltyStatus.repayments.map((repayment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-warning-600 dark:text-warning-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-secondary-900 dark:text-white">
                      Payment #{repayment.installmentNumber}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      Due: {formatDate(repayment.dueDate)} • {getDaysLate(repayment.dueDate)} days late
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-warning-600 dark:text-warning-400">
                    +{formatCurrency(repayment.penaltyAmount)}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Total: {formatCurrency(repayment.totalRepayment)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Payment Info */}
      {nextPaymentDate && (
        <div className="mb-4 p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
          <div className="flex items-center">
            <Info className="h-4 w-4 text-info-600 dark:text-info-400 mr-2" />
            <div className="text-sm text-info-700 dark:text-info-300">
              <strong>Next Payment Due:</strong> {formatDate(nextPaymentDate)}
            </div>
          </div>
        </div>
      )}

      {/* Penalty Rate Info */}
      <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Penalty rate: 0.5% per day after 24-hour grace period
        {lastUpdated && (
          <span className="block mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default PenaltyStatus;
