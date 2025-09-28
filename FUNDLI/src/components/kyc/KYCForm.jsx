import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const KYCForm = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bvn: '',
    accountNumber: '',
    bankCode: ''
  });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setIsLoadingBanks(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('https://fundli-hjqn.vercel.app/api/borrower/banks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setBanks(result.data.banks || []);
      } else {
        console.error('Failed to load banks');
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bvn) {
      newErrors.bvn = 'BVN is required';
    } else if (formData.bvn.length !== 11) {
      newErrors.bvn = 'BVN must be 11 digits';
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 10) {
      newErrors.accountNumber = 'Account number must be at least 10 digits';
    }

    if (!formData.bankCode) {
      newErrors.bankCode = 'Bank selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('🔍 Form validation check:', formData);
    
    if (validateForm()) {
      console.log('✅ Form validation passed, submitting:', {
        bvn: formData.bvn ? formData.bvn.substring(0, 3) + '***' : 'not provided',
        accountNumber: formData.accountNumber ? formData.accountNumber.substring(0, 3) + '***' : 'not provided',
        bankCode: formData.bankCode
      });
      onSubmit(formData);
    } else {
      console.log('❌ Form validation failed, errors:', errors);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            Complete KYC Verification
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Please provide your BVN and bank account details for verification
          </p>
        </div>

        {/* KYC Notice */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">
                Why KYC is Required
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                KYC (Know Your Customer) verification is mandatory for loan applications. 
                This helps ensure the security of our platform and protects all users.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BVN Field */}
          <div>
            <label htmlFor="bvn" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              BVN (Bank Verification Number)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                id="bvn"
                name="bvn"
                value={formData.bvn}
                onChange={handleInputChange}
                placeholder="Enter your 11-digit BVN"
                maxLength="11"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.bvn 
                    ? 'border-error/40 dark:border-error bg-error/10 dark:bg-error/20' 
                    : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700'
                } text-secondary-900 dark:text-neutral-100`}
              />
            </div>
            {errors.bvn && (
              <p className="mt-1 text-sm text-error dark:text-error/50 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.bvn}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Your BVN is a unique 11-digit number that identifies you in the Nigerian banking system
            </p>
          </div>

          {/* Bank Selection */}
          <div>
            <label htmlFor="bankCode" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Select Bank
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <select
                id="bankCode"
                name="bankCode"
                value={formData.bankCode}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.bankCode 
                    ? 'border-error/40 dark:border-error bg-error/10 dark:bg-error/20' 
                    : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700'
                } text-secondary-900 dark:text-neutral-100`}
              >
                <option value="">Select a bank</option>
                {isLoadingBanks ? (
                  <option value="" disabled>Loading banks...</option>
                ) : (
                  banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {errors.bankCode && (
              <p className="mt-1 text-sm text-error dark:text-error/50 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.bankCode}
              </p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Account Number
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Enter your account number"
              maxLength="10"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.accountNumber 
                  ? 'border-error/40 dark:border-error bg-error/10 dark:bg-error/20' 
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700'
              } text-secondary-900 dark:text-neutral-100`}
            />
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-error dark:text-error/50 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.accountNumber}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Enter the account number without spaces or special characters
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-success dark:text-success/50 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-success dark:text-success/30 mb-1">
                  Your Data is Secure
                </h4>
                <p className="text-sm text-success dark:text-success/40">
                  All information is encrypted and securely transmitted. We use industry-standard 
                  security measures to protect your personal and financial information.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                'Verify & Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default KYCForm;
