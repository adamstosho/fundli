import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, isAuthenticated, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login useEffect - isAuthenticated:', isAuthenticated, 'userType:', userType);
    console.log('Login useEffect - userType type:', typeof userType);
    console.log('Login useEffect - userType value:', userType);
    
    if (isAuthenticated && userType) {
      // Check if there's a return URL from location state
      const from = location.state?.from?.pathname || `/dashboard/${userType}`;
      console.log('Redirecting to:', from);
      console.log('Dashboard path constructed:', `/dashboard/${userType}`);
      
      // Clear success message before redirecting
      setSuccess('');
      
      // Navigate to dashboard
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, userType, navigate, location]);

  // Additional effect to monitor auth state changes
  useEffect(() => {
    console.log('Auth state monitor - isAuthenticated:', isAuthenticated, 'userType:', userType);
  }, [isAuthenticated, userType]);

  // Clean up corrupted localStorage data on component mount
  useEffect(() => {
    const cleanupCorruptedData = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData === 'undefined' || userData === 'null') {
          console.log('Login component - Cleaning up corrupted localStorage data');
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } catch (error) {
        console.error('Login component - Error cleaning up localStorage:', error);
      }
    };

    cleanupCorruptedData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error and success messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(''); // Clear any previous success message

    try {
      console.log('Login attempt - Email:', formData.email);
      console.log('Login attempt - Starting login process...');
      
      const result = await login(formData);
      console.log('Login attempt - Login result:', result);
      console.log('Login attempt - Result success:', result.success);
      
      if (result.success) {
        setSuccess('Login successful! Redirecting to dashboard...');
        console.log('Login attempt - Login successful, setting success message');
        console.log('Login attempt - Current auth state - isAuthenticated:', isAuthenticated);
        console.log('Login attempt - Current auth state - userType:', userType);
        
        // Add a small delay to show the success message before the useEffect redirects
        setTimeout(() => {
          console.log('Login attempt - Timeout completed, checking auth state again');
          console.log('Login attempt - isAuthenticated:', isAuthenticated);
          console.log('Login attempt - userType:', userType);
          // This just ensures the success message is visible briefly
          // The actual redirect is handled by the useEffect
        }, 1000);
        
        // Backup navigation: If useEffect doesn't work, navigate directly after 2 seconds
        setTimeout(() => {
          console.log('Login attempt - Backup navigation triggered');
          console.log('Login attempt - Backup navigation - isAuthenticated:', isAuthenticated);
          console.log('Login attempt - Backup navigation - userType:', userType);
          
          if (isAuthenticated && userType) {
            const dashboardPath = `/dashboard/${userType}`;
            console.log('Login attempt - Backup navigation to:', dashboardPath);
            navigate(dashboardPath, { replace: true });
          } else {
            console.log('Login attempt - Backup navigation failed - not authenticated or no userType');
            // Try to get user data from localStorage as last resort
            const userData = localStorage.getItem('user');
            if (userData && userData !== 'null' && userData !== 'undefined') {
              try {
                const user = JSON.parse(userData);
                console.log('Login attempt - Backup navigation - user from localStorage:', user);
                if (user && user.userType) {
                  const dashboardPath = `/dashboard/${user.userType}`;
                  console.log('Login attempt - Backup navigation from localStorage to:', dashboardPath);
                  navigate(dashboardPath, { replace: true });
                } else {
                  console.log('Login attempt - Backup navigation failed - invalid user data structure');
                }
              } catch (e) {
                console.error('Login attempt - Error parsing user data for backup navigation:', e);
                console.log('Login attempt - User data that caused error:', userData);
              }
            } else {
              console.log('Login attempt - Backup navigation failed - no valid user data in localStorage');
            }
          }
        }, 2000);
        
        // The useEffect will handle the redirect when auth state changes
      } else {
        console.log('Login attempt - Login failed:', result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error('Login attempt - Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome back to Fundli
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Link */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Debug: Clear localStorage button (for testing) */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                console.log('localStorage cleared for testing');
                window.location.reload();
              }}
              className="text-xs text-gray-500 hover:text-red-500 underline"
            >
              Clear localStorage (Debug)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 