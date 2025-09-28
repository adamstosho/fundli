import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, TrendingUp, Shield, CheckCircle, AlertCircle, ArrowRight, Calculator } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreatePool = () => {
  const { user, refreshAuthToken, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    poolName: '',
    poolSize: '',
    duration: '',
    interestRate: '',
    minInvestment: '',
    maxInvestment: '',
    description: '',
    riskLevel: 'medium',
    currency: 'USD'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    console.log('CreatePool - Auth state:', {
      authLoading,
      isAuthenticated,
      user: user ? { email: user.email, userType: user.userType } : null
    });
    
    // Check localStorage directly for debugging
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    console.log('CreatePool - localStorage check:', {
      hasToken: !!token,
      hasUserData: !!userData,
      userData: userData ? JSON.parse(userData) : null
    });
    
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        console.log('CreatePool - Not authenticated or no user, checking localStorage...');
        
        // If we have data in localStorage but AuthContext hasn't loaded it yet, wait a bit
        if (token && userData) {
          console.log('CreatePool - Found data in localStorage, waiting for AuthContext to load...');
          // Don't set error yet, wait for AuthContext to process
          return;
        }
        
        setError('Please log in to create a lending pool.');
        setIsCheckingAuth(false);
        return;
      }
      
      if (user.userType !== 'lender') {
        setError('Only lenders can create lending pools.');
        setIsCheckingAuth(false);
        return;
      }
      
      console.log('CreatePool - Authentication successful, user is lender');
      setIsCheckingAuth(false);
    }
  }, [authLoading, isAuthenticated, user]);

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
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        throw new Error('Please log in to create a lending pool.');
      }

      // Check if user is a lender
      if (user.userType !== 'lender') {
        throw new Error('Only lenders can create lending pools.');
      }

      // Get the authentication token
      let token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log('User authenticated:', {
        email: user.email,
        userType: user.userType,
        hasToken: !!token
      });

      // Prepare the pool data
      const poolData = {
        name: formData.poolName,
        description: formData.description,
        poolSize: parseFloat(formData.poolSize),
        duration: parseInt(formData.duration),
        interestRate: parseFloat(formData.interestRate),
        minInvestment: parseFloat(formData.minInvestment),
        maxInvestment: parseFloat(formData.maxInvestment),
        riskLevel: formData.riskLevel,
        currency: formData.currency
      };

      console.log('Creating pool with data:', poolData);

      // Send the request to the backend
      const response = await fetch('https://fundli-hjqn.vercel.app/api/pools', {
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
        // Handle specific error cases
        console.error('Pool creation failed:', {
          status: response.status,
          statusText: response.statusText,
          result: result
        });

        if (response.status === 401) {
          // Try to refresh token first before giving up
          try {
            console.log('Attempting to refresh token...');
            await refreshAuthToken();
            const newToken = localStorage.getItem('accessToken');
            
            if (newToken) {
              console.log('Token refreshed, retrying pool creation...');
              // Retry the request with the new token
              const retryResponse = await fetch('https://fundli-hjqn.vercel.app/api/pools', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${newToken}`
                },
                body: JSON.stringify(poolData)
              });
              
              const retryResult = await retryResponse.json();
              
              if (retryResponse.ok) {
                setSuccess(true);
                console.log('Pool created successfully on retry:', retryResult.data.pool);
                setTimeout(() => {
                  navigate('/dashboard/lender');
                }, 2000);
                return;
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
          
          // If refresh failed or retry failed, then logout
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Only lenders can create pools.');
        } else {
          throw new Error(result.message || result.error || 'Failed to create lending pool');
        }
      }
    } catch (err) {
      console.error('Error creating pool:', err);
      
      // Only redirect to login for specific authentication errors
      if (err.message.includes('Session expired') || 
          err.message.includes('Authentication required') ||
          err.message.includes('Please log in')) {
        
        // Only clear auth data if it's really a session issue
        if (err.message.includes('Session expired')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          logout();
        }
        
        setError(err.message);
        setRedirectCountdown(3);
        
        const countdownInterval = setInterval(() => {
          setRedirectCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              navigate('/login', { state: { from: { pathname: '/marketplace/create-pool' } } });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(err.message || 'Failed to create lending pool. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.poolName && formData.poolSize && formData.duration && 
                     formData.interestRate && formData.minInvestment && formData.maxInvestment;

  // Show loading state while checking authentication or while auth is loading
  if (isCheckingAuth || authLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            {authLoading ? 'Loading...' : 'Verifying authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Create Lending Pool
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
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
          <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-2">
            Pool Created Successfully!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
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
                <div className="flex-1">
                  <div>{error}</div>
                  {redirectCountdown > 0 && (
                    <div className="text-xs mt-1">
                      Redirecting to login in {redirectCountdown} seconds...
                    </div>
                  )}
                  {error.includes('Please log in') && (
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                    >
                      Go to Login
                    </button>
                  )}
                </div>
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
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-neutral-400" />
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
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Total amount available for borrowing in this pool
                </p>
              </div>

              <div>
                <label htmlFor="currency" className="form-label">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="GHS">GHS - Ghanaian Cedi</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                </select>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Select the currency for this lending pool
                </p>
              </div>

              <div>
                <label htmlFor="duration" className="form-label">
                  Duration (months)
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
                    placeholder="Enter duration"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="interestRate" className="form-label">
                  Interest Rate for {formData.duration || 'X'} Month{formData.duration > 1 ? 's' : ''} (%)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TrendingUp className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={formData.interestRate}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter interest rate for the period"
                  />
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Flat interest rate for the entire {formData.duration || 'X'} month period
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
                  Minimum Investment ({formData.currency})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-neutral-400" />
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
                  Maximum Investment ({formData.currency})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-neutral-400" />
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
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1"
              />
              <label htmlFor="terms" className="text-sm text-neutral-700 dark:text-neutral-300">
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