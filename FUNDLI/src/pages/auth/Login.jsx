import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-20 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-20"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-xl opacity-20"
        animate={{
          y: [0, 20, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-purple-200 text-lg">
            Sign in to continue your financial journey
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/10 rounded-r-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-purple-300 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-purple-300 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-300 mr-3" />
                  <p className="text-red-200 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3" />
                  <p className="text-green-200 text-sm font-medium">{success}</p>
                </div>
              </motion.div>
            )}

            {/* Forgot Password Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-end"
            >
              <Link
                to="/forgot-password"
                className="text-purple-300 hover:text-white text-sm font-medium transition-colors duration-300 hover:underline"
              >
                Forgot your password?
              </Link>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-center"
            >
              <p className="text-purple-200 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-white hover:text-purple-200 transition-colors duration-300 hover:underline"
                >
                  Create one here
                </Link>
              </p>
            </motion.div>
          </form>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-3 gap-4 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <Shield className="h-6 w-6 text-purple-300 mx-auto mb-2" />
            <p className="text-purple-200 text-xs font-medium">Secure</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <Zap className="h-6 w-6 text-purple-300 mx-auto mb-2" />
            <p className="text-purple-200 text-xs font-medium">Fast</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <Sparkles className="h-6 w-6 text-purple-300 mx-auto mb-2" />
            <p className="text-purple-200 text-xs font-medium">Smart</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 