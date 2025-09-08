import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, TrendingUp, Shield, CheckCircle, AlertCircle, ArrowRight, Calculator } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreatePool = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    poolName: '',
    poolSize: '',
    duration: '',
    interestRate: '',
    minInvestment: '',
    maxInvestment: '',
    description: '',
    riskLevel: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // KYC verification is now optional - all users can create lending pools

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get the authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare the pool data
      const poolData = {
        name: formData.poolName,
        description: formData.description,
        poolSize: parseFloat(formData.poolSize),
        duration: parseInt(formData.duration),
        interestRate: parseFloat(formData.interestRate),
        minInvestment: parseFloat(formData.minInvestment),
        maxInvestment: parseFloat(formData.maxInvestment),
        riskLevel: formData.riskLevel
      };

      console.log('Creating pool with data:', poolData);

      // Send the request to the backend
      const response = await fetch('http://localhost:5000/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(poolData)
      });

      const result = await response.json();
      console.log('Pool creation response:', result);

      if (response.ok) {
        setSuccess(true);
        console.log('Pool created successfully:', result.data.pool);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard/lender');
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to create lending pool');
      }
    } catch (err) {
      console.error('Error creating pool:', err);
      setError(err.message || 'Failed to create lending pool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.poolName && formData.poolSize && formData.duration && 
                     formData.interestRate && formData.minInvestment && formData.maxInvestment;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Lending Pool
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set up a new lending pool to start earning returns
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
            Pool Created Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your lending pool has been created and is now active.
          </p>
        </motion.div>
      ) : (
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

            <div>
              <label htmlFor="poolName" className="form-label">
                Pool Name
              </label>
              <input
                id="poolName"
                name="poolName"
                type="text"
                required
                value={formData.poolName}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter a descriptive name for your pool"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="poolSize" className="form-label">
                  Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="poolSize"
                    name="poolSize"
                    type="number"
                    min="1000"
                    max="1000000"
                    required
                    value={formData.poolSize}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter total amount available for borrowing"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Total amount available for borrowing in this pool
                </p>
              </div>

              <div>
                <label htmlFor="duration" className="form-label">
                  Duration (months)
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
                    placeholder="Enter duration"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="interestRate" className="form-label">
                  Monthly Interest Rate (%)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    required
                    value={formData.interestRate}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter monthly interest rate"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Monthly interest rate charged to borrowers
                </p>
              </div>

              <div>
                <label htmlFor="riskLevel" className="form-label">
                  Risk Level
                </label>
                <select
                  id="riskLevel"
                  name="riskLevel"
                  required
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="minInvestment" className="form-label">
                  Minimum Investment (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="minInvestment"
                    name="minInvestment"
                    type="number"
                    min="100"
                    required
                    value={formData.minInvestment}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter minimum investment"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maxInvestment" className="form-label">
                  Maximum Investment (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="maxInvestment"
                    name="maxInvestment"
                    type="number"
                    min="100"
                    required
                    value={formData.maxInvestment}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter maximum investment"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Pool Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder="Describe your lending strategy, target borrowers, and any specific criteria..."
              />
            </div>

            <div className="flex items-start space-x-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the Terms and Conditions
              </label>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Pool...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Create Lending Pool
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreatePool; 