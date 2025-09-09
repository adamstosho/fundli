import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, Shield, Zap, TrendingUp, Users, Globe, Smartphone } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-primary-50 to-secondary-100 dark:from-secondary-900 dark:via-primary-900 dark:to-secondary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-20 w-20 h-20 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full blur-xl opacity-20"
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
        className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full blur-xl opacity-20"
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
        {/* Header with Unique Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {/* Main Logo Container */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-glow-primary transition-all duration-300 group-hover:scale-105">
                {/* Unique Logo Design - Stylized "F" with Financial Elements */}
                <div className="relative">
                  {/* Main F Letter */}
                  <div className="w-8 h-8 relative">
                    {/* Vertical line of F */}
                    <div className="absolute left-0 top-0 w-1 h-8 bg-white rounded-full"></div>
                    {/* Top horizontal line */}
                    <div className="absolute left-0 top-0 w-6 h-1 bg-white rounded-full"></div>
                    {/* Middle horizontal line */}
                    <div className="absolute left-0 top-3 w-4 h-1 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Financial Elements */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
              
              {/* Floating Elements around Logo */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full flex items-center justify-center animate-bounce">
                <TrendingUp className="h-2 w-2 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                <Shield className="h-1.5 w-1.5 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-h1 text-gradient mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-600 dark:text-neutral-200 text-lg">
            Sign in to continue your financial journey
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-8 backdrop-blur-lg bg-white/80 dark:bg-white/10 border border-neutral-200/50 dark:border-white/20"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <label htmlFor="email" className="form-label text-neutral-700 dark:text-white">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-300 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-12 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-200 bg-white dark:bg-white/10 border-neutral-300 dark:border-white/20 backdrop-blur-sm"
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
                <label htmlFor="password" className="form-label text-neutral-700 dark:text-white">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-300 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pl-12 pr-12 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-200 bg-white dark:bg-white/10 border-neutral-300 dark:border-white/20 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-neutral-100 dark:hover:bg-white/10 rounded-r-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400 dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400 dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-white transition-colors" />
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
                className="bg-error/20 border border-error/30 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-error mr-3" />
                  <p className="text-error text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-success/20 border border-success/30 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <p className="text-success text-sm font-medium">{success}</p>
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
                className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-white text-sm font-medium transition-colors duration-300 hover:underline"
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
                className="w-full btn-cta disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
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
              <p className="text-neutral-600 dark:text-neutral-200 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary-600 dark:text-white hover:text-primary-700 dark:hover:text-primary-200 transition-colors duration-300 hover:underline"
                >
                  Create one here
                </Link>
              </p>
            </motion.div>
          </form>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
        >
          <div className="card p-4 border-neutral-200/50 dark:border-white/10 group hover:border-primary-400/50 transition-all duration-300 bg-white/60 dark:bg-white/5">
            <Shield className="h-6 w-6 text-neutral-500 dark:text-neutral-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 mx-auto mb-2 transition-colors" />
            <p className="text-neutral-600 dark:text-neutral-200 text-xs font-medium group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">Secure</p>
          </div>
          <div className="card p-4 border-neutral-200/50 dark:border-white/10 group hover:border-primary-400/50 transition-all duration-300 bg-white/60 dark:bg-white/5">
            <Zap className="h-6 w-6 text-neutral-500 dark:text-neutral-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 mx-auto mb-2 transition-colors" />
            <p className="text-neutral-600 dark:text-neutral-200 text-xs font-medium group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">Fast</p>
          </div>
          <div className="card p-4 border-neutral-200/50 dark:border-white/10 group hover:border-primary-400/50 transition-all duration-300 bg-white/60 dark:bg-white/5">
            <TrendingUp className="h-6 w-6 text-neutral-500 dark:text-neutral-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 mx-auto mb-2 transition-colors" />
            <p className="text-neutral-600 dark:text-neutral-200 text-xs font-medium group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">Smart</p>
          </div>
          <div className="card p-4 border-neutral-200/50 dark:border-white/10 group hover:border-primary-400/50 transition-all duration-300 bg-white/60 dark:bg-white/5">
            <Globe className="h-6 w-6 text-neutral-500 dark:text-neutral-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 mx-auto mb-2 transition-colors" />
            <p className="text-neutral-600 dark:text-neutral-200 text-xs font-medium group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">Global</p>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-6 text-neutral-500 dark:text-neutral-400 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Trusted by 10K+</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;