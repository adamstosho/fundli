import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, FileText, CheckCircle, AlertCircle, ArrowRight, Shield, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ManualCollateralVerification from '../../components/collateral/ManualCollateralVerification';

const LoanApplication = () => {
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '',
    repaymentSchedule: 'monthly',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState('loan-form'); // 'loan-form', 'collateral-verification', 'success'
  const [collateralStatus, setCollateralStatus] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check collateral verification status on component mount
  useEffect(() => {
    checkCollateralStatus();
  }, []);

  const checkCollateralStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/collateral/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollateralStatus(data.data.collateral);
      }
    } catch (error) {
      console.error('Error checking collateral status:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLoanFormSubmit = async (e) => {
    e.preventDefault();
    
    // Check if collateral verification is required
    if (!collateralStatus || collateralStatus.verificationStatus !== 'approved') {
      setCurrentStep('collateral-verification');
      return;
    }

    // Proceed with loan application if collateral is approved
    await submitLoanApplication();
  };

  const submitLoanApplication = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Format data for backend
      const loanData = {
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        duration: parseInt(formData.duration),
        repaymentSchedule: formData.repaymentSchedule,
        description: formData.description
      };

      const response = await fetch('http://localhost:5000/api/borrower/loan/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(loanData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit loan application');
      }

      setCurrentStep('success');
      setError('');
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/loans/status');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollateralSubmit = async (formData, collateralDocuments, bankStatement) => {
    setIsLoading(true);
    setError('');

    try {
      // Debug: Check what tokens are available
      console.log('Available localStorage keys:', Object.keys(localStorage));
      console.log('accessToken:', localStorage.getItem('accessToken'));
      console.log('token:', localStorage.getItem('token'));
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required - please log in again');
      }

      // Prepare data for JSON submission
      const submitData = {
        collateralType: formData.collateralType,
        description: formData.description,
        estimatedValue: formData.estimatedValue,
        bvn: formData.bvn,
        documentTypes: formData.documentTypes,
        collateralDocuments: collateralDocuments.map(doc => ({
          name: doc.name,
          base64: doc.base64,
          size: doc.size,
          type: doc.file?.type || 'application/octet-stream'
        })),
        bankStatement: bankStatement ? {
          name: bankStatement.name,
          base64: bankStatement.base64,
          size: bankStatement.size,
          type: bankStatement.file?.type || 'application/octet-stream'
        } : null
      };

      const response = await fetch('http://localhost:5000/api/collateral/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit collateral verification');
      }

      // Check collateral status and proceed with loan application
      await checkCollateralStatus();
      alert('Collateral verification submitted successfully! You can now proceed with your loan application.');
      
      // Go back to loan form to show updated status
      setCurrentStep('loan-form');
    } catch (err) {
      setError(err.message || 'Failed to submit collateral verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollateralCancel = () => {
    setCurrentStep('loan-form');
  };

  const isFormValid = formData.amount && formData.purpose && formData.duration && formData.description;

  const getCollateralStatusMessage = () => {
    if (!collateralStatus) {
      return {
        message: "Collateral verification required before applying for a loan",
        type: "warning",
        action: "Complete Verification"
      };
    }

    switch (collateralStatus.verificationStatus) {
      case 'pending':
        return {
          message: "Collateral verification not yet submitted",
          type: "warning",
          action: "Complete Verification"
        };
      case 'submitted':
        return {
          message: "Collateral verification submitted and under review",
          type: "info",
          action: "View Status"
        };
      case 'under_review':
        return {
          message: "Collateral verification is being reviewed by our team",
          type: "info",
          action: "View Status"
        };
      case 'approved':
        return {
          message: "Collateral verification approved! You can proceed with loan application",
          type: "success",
          action: "Proceed"
        };
      case 'rejected':
        return {
          message: `Collateral verification rejected: ${collateralStatus.adminReview?.rejectionReason || 'Please contact support'}`,
          type: "error",
          action: "Resubmit Verification"
        };
      default:
        return {
          message: "Collateral verification required",
          type: "warning",
          action: "Complete Verification"
        };
    }
  };

  const statusInfo = getCollateralStatusMessage();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 dark:text-white mb-2">
          Apply for a Loan
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Complete the form below to submit your loan application
        </p>
      </div>

      {/* Collateral Status Banner */}
      {currentStep === 'loan-form' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          statusInfo.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
          statusInfo.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
          statusInfo.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
          'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {statusInfo.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {statusInfo.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
              {statusInfo.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {statusInfo.type === 'info' && <FileText className="h-5 w-5 text-blue-600" />}
              <p className={`text-sm font-medium ${
                statusInfo.type === 'success' ? 'text-green-800 dark:text-green-200' :
                statusInfo.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                statusInfo.type === 'error' ? 'text-red-800 dark:text-red-200' :
                'text-blue-800 dark:text-blue-200'
              }`}>
                {statusInfo.message}
              </p>
            </div>
            {statusInfo.type !== 'success' && (
              <button
                onClick={() => setCurrentStep('collateral-verification')}
                className="text-sm px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {statusInfo.action}
              </button>
            )}
          </div>
        </div>
      )}

      {currentStep === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center"
        >
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-h2 text-neutral-900 dark:text-white mb-2">
            Application Submitted!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Your loan application has been submitted successfully. We'll review it and get back to you within 24-48 hours.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Redirecting to loan status...</p>
        </motion.div>
      )}

      {currentStep === 'collateral-verification' && (
        <ManualCollateralVerification
          onSubmit={handleCollateralSubmit}
          onCancel={handleCollateralCancel}
          isSubmitting={isLoading}
        />
      )}

      {currentStep === 'loan-form' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="card p-8">
            <form onSubmit={handleLoanFormSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </motion.div>
              )}

              {/* Loan Amount */}
              <div>
                <label htmlFor="amount" className="form-label">
                  Loan Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="100"
                    max="50000"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter loan amount (min: $100, max: $50,000)"
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Minimum: $100 | Maximum: $50,000
                </p>
              </div>

              {/* Loan Purpose */}
              <div>
                <label htmlFor="purpose" className="form-label">
                  Loan Purpose
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  required
                  value={formData.purpose}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select loan purpose</option>
                  <option value="business">Business Expansion</option>
                  <option value="education">Education</option>
                  <option value="home_improvement">Home Improvement</option>
                  <option value="debt_consolidation">Debt Consolidation</option>
                  <option value="medical">Medical Expenses</option>
                  <option value="vehicle">Vehicle Purchase</option>
                  <option value="personal">Personal Use</option>
                  <option value="investment">Investment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Loan Duration */}
              <div>
                <label htmlFor="duration" className="form-label">
                  Loan Duration (months)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="duration"
                    name="duration"
                    type="number"
                    min="3"
                    max="60"
                    required
                    value={formData.duration}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter duration in months (3-60 months)"
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Minimum: 3 months | Maximum: 60 months
                </p>
              </div>

              {/* Repayment Schedule */}
              <div>
                <label htmlFor="repaymentSchedule" className="form-label">
                  Repayment Schedule
                </label>
                <select
                  id="repaymentSchedule"
                  name="repaymentSchedule"
                  required
                  value={formData.repaymentSchedule}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="monthly">Monthly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="form-label">
                  Additional Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Provide additional details about your loan purpose and how you plan to use the funds..."
                />
              </div>

              {/* Collateral verification is now handled separately */}

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="terms" className="text-sm text-neutral-700 dark:text-neutral-300">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Application...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {statusInfo.type === 'success' ? 'Submit Application' : 'Continue to Collateral Verification'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="card p-6 mt-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-1">
                  Application Process
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Your application will be reviewed within 24-48 hours. We'll notify you via email about the status. 
                  Make sure all information is accurate and complete to avoid delays.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LoanApplication; 