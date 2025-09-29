import { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';

const PaymentPage = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(buildApiUrl(`/loans/${loanId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLoan(result.data);
        setPaymentAmount(result.data.loanAmount);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load loan details');
      }
    } catch (error) {
      console.error('Error loading loan details:', error);
      setError('Failed to load loan details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');

      // Validate payment amount
      if (paymentAmount <= 0) {
        alert('Please enter a valid payment amount');
        setIsProcessing(false);
        return;
      }

      if (paymentAmount > loan?.loanAmount) {
        alert('Payment amount cannot exceed loan amount');
        setIsProcessing(false);
        return;
      }

      // First, create a payment intent on the backend
      const response = await fetch(buildApiUrl('/payments/create-intent'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loanId: loanId,
          amount: paymentAmount,
          currency: 'NGN'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if Paystack is properly configured
        if (!result.data.publicKey || result.data.publicKey.includes('your_')) {
          alert('Paystack is not properly configured. Please contact support.');
          setIsProcessing(false);
          return;
        }
        
        // Initialize Paystack
        const handler = window.PaystackPop.setup({
          key: result.data.publicKey,
          email: result.data.email,
          amount: result.data.amount * 100, // Convert to kobo
          currency: result.data.currency,
          ref: result.data.reference,
          metadata: {
            loanId: loanId,
            lenderId: result.data.lenderId || 'unknown'
          },
          callback: function(response) {
            // Handle successful payment
            handlePaymentSuccess(response.reference);
          },
          onClose: function() {
            // Handle payment cancellation
            setIsProcessing(false);
            alert('Payment was cancelled');
          }
        });

        handler.openIframe();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to initialize payment');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (reference) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(buildApiUrl('/payments/verify'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference: reference,
          loanId: loanId
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Payment successful! Loan application has been accepted.');
        navigate('/dashboard/lender');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Payment verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">Error</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/lender')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/lender')}
            className="flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Accept Loan Application
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Complete the payment to accept this loan application
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loan Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-6 flex items-center">
              <CreditCard className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
              Loan Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Borrower:</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  {loan?.borrower?.name}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Loan Amount:</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  ${loan?.loanAmount?.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Purpose:</span>
                <span className="font-medium text-secondary-900 dark:text-white capitalize">
                  {loan?.purpose}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  {loan?.duration} months
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Interest Rate:</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  {loan?.interestRate}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Monthly Payment:</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  ${loan?.monthlyPayment?.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-success dark:text-success/50" />
              Payment Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Loan amount: ${loan?.loanAmount?.toLocaleString()}
                </p>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                  Payment Security
                </h3>
                <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Secured by Paystack
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    SSL encrypted
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    PCI DSS compliant
                  </li>
                </ul>
              </div>

              <button
                onClick={handlePaystackPayment}
                disabled={isProcessing || paymentAmount <= 0 || paymentAmount > loan?.loanAmount}
                className="w-full bg-success hover:bg-success disabled:bg-neutral-400 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay with Paystack</span>
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                By proceeding, you agree to our terms and conditions
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
