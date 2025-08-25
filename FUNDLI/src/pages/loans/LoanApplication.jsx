import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, FileText, Upload, X, CheckCircle, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoanApplication = () => {
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '',
    repaymentSchedule: 'monthly',
    collateral: null,
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user needs to complete KYC
  if (user?.kycStatus !== 'approved' && user?.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            KYC Verification Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to complete your KYC verification before you can apply for loans.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/kyc-upload')}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Complete KYC Verification
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      setFormData(prev => ({ ...prev, collateral: file }));
      setError('');
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, collateral: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      // Add collateral if provided
      if (formData.collateral) {
        loanData.collateral = {
          type: 'other', // Default type
          description: formData.collateral.name || 'Uploaded document',
          estimatedValue: 0
        };
      }

      const response = await fetch('http://localhost:5000/api/loans/apply', {
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

      setSuccess(true);
      setError('');
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/loans/status');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit loan application. Please try again.');
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.amount && formData.purpose && formData.duration && formData.description;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Apply for a Loan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete the form below to submit your loan application
        </p>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center"
        >
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your loan application has been submitted successfully. We'll review it and get back to you within 24-48 hours.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Redirecting to loan status...</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <DollarSign className="h-5 w-5 text-gray-400" />
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
                <p className="text-sm text-gray-500 mt-1">
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
                    <Calendar className="h-5 w-5 text-gray-400" />
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
                <p className="text-sm text-gray-500 mt-1">
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

              {/* Collateral Upload */}
              <div>
                <label className="form-label">
                  Collateral Documentation
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  {formData.collateral ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-success">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">File uploaded successfully</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.collateral.name}
                        </span>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="p-1 text-gray-400 hover:text-error transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="collateral" className="cursor-pointer">
                          <span className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium">
                            Click to upload
                          </span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </label>
                        <input
                          id="collateral"
                          name="collateral"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX, JPG, PNG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
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
                    Submit Application
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