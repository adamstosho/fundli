import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, ArrowRight, Sparkles, Shield, Zap, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'borrower',
    referralCode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setIsLoading(false);
      return;
    }

    // Phone number validation - ensure it's a valid format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      setIsLoading(false);
      return;
    }

    try {
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...registrationData } = formData;
      
      // Clean phone number format
      registrationData.phone = registrationData.phone.replace(/\s/g, '');
      
      console.log('Registration - Data being sent to API:', registrationData);
      console.log('Registration - userType being sent:', registrationData.userType);
      
      const result = await register(registrationData);
      console.log('Registration - API response:', result);
      
      if (result.success) {
        setSuccess(result.message);
        console.log('Registration successful, navigating to OTP with userType:', formData.userType);
        // Redirect to OTP verification immediately (user stays logged in)
        navigate('/verify-otp', { 
          state: { 
            email: formData.email,
            userType: formData.userType 
          } 
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
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
            Join Fundli
          </h2>
          <p className="text-purple-200 text-lg">
            Start your financial journey with us today
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <label htmlFor="firstName" className="block text-sm font-semibold text-white mb-2">
                    First Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="First name"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <label htmlFor="lastName" className="block text-sm font-semibold text-white mb-2">
                    Last Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Last name"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
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
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </motion.div>

              {/* Phone Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <label htmlFor="phone" className="block text-sm font-semibold text-white mb-2">
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter your phone number"
                  />
                </div>
                <p className="mt-2 text-xs text-purple-300">
                  Format: +1234567890 or 1234567890 (numbers only)
                </p>
              </motion.div>

              {/* Referral Code Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label htmlFor="referralCode" className="block text-sm font-semibold text-white mb-2">
                  Referral Code (Optional)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter referral code (optional)"
                  />
                </div>
                <p className="mt-2 text-xs text-purple-300">
                  Have a friend's referral code? Enter it here to earn rewards together
                </p>
              </motion.div>

              {/* User Type Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <label className="block text-sm font-semibold text-white mb-3">
                  I want to:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer rounded-xl border border-white/20 bg-white/5 p-4 shadow-sm focus:outline-none hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                    <input
                      type="radio"
                      name="userType"
                      value="borrower"
                      checked={formData.userType === 'borrower'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-semibold text-white">Borrow Money</span>
                        <span className="mt-1 flex items-center text-sm text-purple-200">Get loans for your needs</span>
                      </span>
                    </span>
                    <span className={`pointer-events-none absolute -inset-px rounded-xl border-2 transition-colors ${
                      formData.userType === 'borrower' ? 'border-purple-500' : 'border-transparent'
                    }`} />
                  </label>
                  
                  <label className="relative flex cursor-pointer rounded-xl border border-white/20 bg-white/5 p-4 shadow-sm focus:outline-none hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                    <input
                      type="radio"
                      name="userType"
                      value="lender"
                      checked={formData.userType === 'lender'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-semibold text-white">Lend Money</span>
                        <span className="mt-1 flex items-center text-sm text-purple-200">Earn returns on investments</span>
                      </span>
                    </span>
                    <span className={`pointer-events-none absolute -inset-px rounded-xl border-2 transition-colors ${
                      formData.userType === 'lender' ? 'border-purple-500' : 'border-transparent'
                    }`} />
                  </label>
                </div>
              </motion.div>


              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
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
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Create a strong password"
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
                  <p className="mt-2 text-xs text-purple-300">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-purple-300 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/10 rounded-r-xl transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-purple-300 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-purple-300 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
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

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </motion.div>

            {/* Sign In Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-center"
            >
              <p className="text-purple-200 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-white hover:text-purple-200 transition-colors duration-300 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </form>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="grid grid-cols-4 gap-4 text-center mt-8"
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
            <TrendingUp className="h-6 w-6 text-purple-300 mx-auto mb-2" />
            <p className="text-purple-200 text-xs font-medium">Profitable</p>
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

export default Register; 