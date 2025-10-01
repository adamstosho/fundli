import { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/config';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  User,
  Calendar,
  TrendingUp,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PayBackPage = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  console.log('🔍 PayBackPage loaded with loanId:', loanId);
  console.log('🔍 Location state:', location.state);
  
  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [repaymentAmount, setRepaymentAmount] = useState(0);
  const [penaltyData, setPenaltyData] = useState(null);

  // Fetch penalty status
  const fetchPenaltyStatus = async () => {
    if (!loanId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl(`/borrower/loan/${loanId}/penalty-status`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPenaltyData(data.data);
        
        // Update repayment amount with penalties
        if (data.data.penaltyStatus) {
          const totalWithPenalties = data.data.penaltyStatus.totalRepaymentAmount;
          setRepaymentAmount(totalWithPenalties);
        }
      }
    } catch (error) {
      console.error('Error fetching penalty status:', error);
    }
  };

  useEffect(() => {
    if (location.state?.loan) {
      setLoan(location.state.loan);
      setIsLoading(false);
      
      // Calculate base repayment amount (will be updated with penalties)
      const principal = location.state.loan.loanAmount || 0;
      const interestRate = location.state.loan.interestRate || 0;
      const interestAmount = principal * (interestRate / 100);
      const baseRepayment = principal + interestAmount;
      const amountPaid = location.state.loan.amountPaid || 0;
      const remaining = baseRepayment - amountPaid;
      
      setRepaymentAmount(remaining);
      
      // Fetch penalty status
      fetchPenaltyStatus();
    } else {
      // Fetch loan data if not passed via state
      fetchLoanData();
    }
    
    fetchWalletBalance();
  }, [loanId, location.state]);

  const fetchLoanData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔍 Fetching loan data for loanId:', loanId);
      console.log('🔍 API URL:', buildApiUrl(`/loans/${loanId}`));
      
      const response = await fetch(buildApiUrl(`/loans/${loanId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🔍 Loan API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Loan API response data:', data);
        setLoan(data.data.loan);
        
        // Calculate repayment amount
        const principal = data.data.loan.loanAmount || 0;
        const interestRate = data.data.loan.interestRate || 0;
        const interestAmount = principal * (interestRate / 100);
        const totalRepayment = principal + interestAmount;
        const amountPaid = data.data.loan.amountPaid || 0;
        const remaining = totalRepayment - amountPaid;
        
        setRepaymentAmount(remaining);
      } else {
        console.error('❌ Loan API error:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('❌ Loan API error data:', errorData);
        setError(`Failed to load loan details: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching loan:', error);
      setError('Failed to load loan details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl('/wallet'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Wallet API response:', data);
        console.log('🔍 Wallet balance:', data.data.wallet.balance);
        console.log('🔍 Wallet currency:', data.data.wallet.currency);
        setWalletBalance(data.data.wallet.balance || 0);
      } else {
        console.error('❌ Wallet API error:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('❌ Wallet API error data:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error);
    }
  };

  const handlePayBack = async () => {
    if (!loan) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      
      // Check if user has sufficient balance
      if (walletBalance < repaymentAmount) {
        setError(`Insufficient balance. Required: $${repaymentAmount.toLocaleString()}, Available: $${walletBalance.toLocaleString()}`);
        setIsProcessing(false);
        return;
      }

      // Confirm payment
      const confirmed = window.confirm(
        `Are you sure you want to make a payment?\n\n` +
        `Amount: $${repaymentAmount.toLocaleString()}\n` +
        `Loan Purpose: ${loan.purpose}\n` +
        `This will process the payment through Paystack and transfer the amount to the lender to settle your loan.`
      );
      
      if (!confirmed) {
        setIsProcessing(false);
        return;
      }

      // Make repayment API call using Paystack-integrated route
      console.log('🔍 Making repayment API call to:', buildApiUrl(`/borrower/repay-loan/${loanId}`));
      console.log('🔍 Request body:', { installmentNumber: null });
      
      const response = await fetch(buildApiUrl(`/borrower/repay-loan/${loanId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          installmentNumber: null // Pay full remaining amount
        })
      });

      console.log('🔍 API response status:', response.status);
      console.log('🔍 API response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Payment successful! ${result.message}`);
        
        // Refresh wallet balance
        await fetchWalletBalance();
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard/borrower');
        }, 3000);
      } else {
        try {
          const errorData = await response.json();
          console.log('❌ API error response:', errorData);
          console.log('❌ Response status:', response.status);
          console.log('❌ Response statusText:', response.statusText);
          setError(`Payment failed: ${errorData.message}`);
        } catch (parseError) {
          console.log('❌ Could not parse error response as JSON');
          console.log('❌ Response status:', response.status);
          console.log('❌ Response statusText:', response.statusText);
          setError(`Payment failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error making payment:', error);
      setError('Failed to make payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!loan?.fundedAt || !loan?.duration) return 0;
    
    const fundedDate = new Date(loan.fundedAt);
    const dueDate = new Date(fundedDate);
    dueDate.setMonth(dueDate.getMonth() + loan.duration);
    const today = new Date();
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Loan Not Found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">The loan you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/borrower')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining();
  const principal = loan.loanAmount || 0;
  const interestRate = loan.interestRate || 0;
  const interestAmount = principal * (interestRate / 100);
  const totalRepayment = principal + interestAmount;
  const amountPaid = loan.amountPaid || 0;
  const amountRemaining = totalRepayment - amountPaid;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/borrower')}
            className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Loan Repayment
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Settle your loan by transferring the repayment amount to the lender
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg p-4 mb-6"
          >
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-error dark:text-error/30 font-medium mb-1">Payment Error</p>
                <p className="text-error dark:text-error/40 text-sm">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg p-4 mb-6"
          >
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-success dark:text-success/50 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-success dark:text-success/30 font-medium mb-1">Payment Successful!</p>
                <p className="text-success dark:text-success/40 text-sm">{success}</p>
                <p className="text-success dark:text-success/40 text-xs mt-1">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Loan Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Summary */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <CreditCard className="h-6 w-6 mr-2 text-primary-600" />
                Loan Summary
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Purpose</span>
                  <p className="font-semibold text-secondary-900 dark:text-white capitalize">
                    {loan.purpose}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Status</span>
                  <p className="font-semibold text-success-600 dark:text-success-400 capitalize">
                    {loan.status}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Principal Amount</span>
                  <p className="font-semibold text-secondary-900 dark:text-white">
                    ${principal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Interest Rate</span>
                  <p className="font-semibold text-secondary-900 dark:text-white">
                    {interestRate}% (Flat Rate)
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Duration</span>
                  <p className="font-semibold text-secondary-900 dark:text-white">
                    {loan.duration} months
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Interest Amount</span>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">
                    ${interestAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Penalty Information */}
            {penaltyData && penaltyData.penaltyStatus.hasPendingPenalties && (
              <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800 p-6">
                <h2 className="text-xl font-semibold text-warning-800 dark:text-warning-200 mb-4 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2 text-warning-600" />
                  Late Payment Penalties
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-warning-700 dark:text-warning-300">Penalty Charges</span>
                    <span className="font-bold text-lg text-warning-800 dark:text-warning-200">
                      ${penaltyData.penaltyStatus.totalPenaltyAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-warning-600 dark:text-warning-400">
                    <Info className="h-4 w-4 inline mr-1" />
                    Penalty rate: 0.5% per day after 24-hour grace period
                  </div>
                  
                  {penaltyData.penaltyStatus.repayments.map((repayment, index) => (
                    <div key={index} className="bg-warning-100 dark:bg-warning-900/30 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-warning-700 dark:text-warning-300">
                          Payment #{repayment.installmentNumber}
                        </span>
                        <span className="text-sm font-medium text-warning-800 dark:text-warning-200">
                          +${repayment.penaltyAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                        Due: {new Date(repayment.dueDate).toLocaleDateString()} • {repayment.penaltyDays} days late
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repayment Information */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="h-6 w-6 mr-2 text-success-600" />
                Repayment Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-secondary-700">
                  <span className="text-neutral-600 dark:text-neutral-400">Base Repayment</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    ${totalRepayment.toLocaleString()}
                  </span>
                </div>
                
                {penaltyData && penaltyData.penaltyStatus.hasPendingPenalties && (
                  <div className="flex justify-between items-center py-2 border-b border-warning-200 dark:border-warning-800">
                    <span className="text-warning-600 dark:text-warning-400">Penalty Charges</span>
                    <span className="font-semibold text-warning-600 dark:text-warning-400">
                      +${penaltyData.penaltyStatus.totalPenaltyAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-secondary-700">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Due</span>
                  <span className="font-bold text-lg text-secondary-900 dark:text-white">
                    ${repaymentAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-200 dark:border-secondary-700">
                  <span className="text-neutral-600 dark:text-neutral-400">Amount Paid</span>
                  <span className="font-semibold text-success-600 dark:text-success-400">
                    ${amountPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-600 dark:text-neutral-400">Amount Remaining</span>
                  <span className="font-bold text-xl text-primary-600 dark:text-primary-400">
                    ${amountRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-accent-600" />
                Timeline
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Applied Date</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {new Date(loan.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Funded Date</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {loan.fundedAt ? new Date(loan.fundedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Due Date</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {(() => {
                      if (loan.fundedAt && loan.duration) {
                        const fundedDate = new Date(loan.fundedAt);
                        const dueDate = new Date(fundedDate);
                        dueDate.setMonth(dueDate.getMonth() + loan.duration);
                        return dueDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      }
                      return 'N/A';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Days Remaining</span>
                  <span className={`font-medium ${daysRemaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-error dark:text-error-400'}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days` : daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-success-600" />
                  Wallet Balance
                </h3>
                <button
                  onClick={fetchWalletBalance}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Refresh
                </button>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                  ${walletBalance.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Available Balance
                </p>
              </div>
            </div>

            {/* Payment Action */}
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600" />
                Make Payment
              </h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-neutral-50 dark:bg-secondary-900 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Payment Amount</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${amountRemaining.toLocaleString()}
                  </p>
                </div>

                {walletBalance < amountRemaining && (
                  <div className="p-3 bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg">
                    <p className="text-sm text-error dark:text-error/40">
                      Insufficient balance. You need ${(amountRemaining - walletBalance).toLocaleString()} more.
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePayBack}
                  disabled={isProcessing || walletBalance < amountRemaining}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5" />
                      <span>Pay Back ${amountRemaining.toLocaleString()}</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
                  This will process the payment through Paystack and transfer the amount to the lender to settle your loan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayBackPage;
