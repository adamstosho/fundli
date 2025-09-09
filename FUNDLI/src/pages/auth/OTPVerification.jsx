import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP } = useAuth();
  
  const { email, userType } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      console.log('OTP verification - Starting verification for email:', email);
      console.log('OTP verification - userType from state:', userType);
      console.log('OTP verification - OTP entered:', otpString);
      
      const result = await verifyOTP(email, otpString);
      console.log('OTP verification - Result:', result);
      
      if (result.success) {
        // OTP verified successfully, navigate to KYC upload
        console.log('OTP verified successfully, navigating to KYC with userType:', userType);
        console.log('OTP verification - userType being passed to KYC:', userType);
        
        navigate('/kyc-upload', { 
          state: { 
            email,
            userType 
          } 
        });
      } else {
        setError(result.message || 'Invalid OTP code. Please try again.');
      }
      
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Invalid OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await resendOTP(email);
      
      if (result.success) {
        // Reset timer and disable resend
        setTimeLeft(300);
        setCanResend(false);
        // Clear any existing error
        setError('');
      } else {
        setError(result.message || 'Failed to resend OTP. Please try again.');
      }
      
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <span className="text-3xl font-bold text-gradient">Fundli</span>
          </Link>
          
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h2 className="text-h1 text-neutral-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            We've sent a 6-digit code to
          </p>
          <p className="text-primary-600 dark:text-primary-400 font-medium">
            {email}
          </p>
        </div>

        {/* OTP Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* OTP Input Fields */}
            <div>
              <label className="form-label text-center block">
                Enter the 6-digit code
              </label>
              <div className="flex justify-center space-x-2 mt-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-all"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
              {!canResend ? (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Resend code in {formatTime(timeLeft)}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isOtpComplete || isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Didn't receive the code? Check your spam folder or{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isLoading}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium disabled:opacity-50"
              >
                try a different email address
              </button>
            </p>
          </div>
        </div>

        {/* Back to Register */}
        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to registration
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerification; 