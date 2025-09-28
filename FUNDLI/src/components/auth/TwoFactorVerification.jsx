import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TwoFactorVerification = ({ onSuccess, onCancel, onUseBackupCode }) => {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTokenVerification = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeVerification = async () => {
    if (!backupCode || backupCode.length !== 8) {
      setError('Please enter a valid 8-character backup code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/2fa/verify-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupCode })
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid backup code');
      }
    } catch (error) {
      setError('Backup code verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = () => {
    setToken('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            {useBackupCode 
              ? 'Enter one of your backup codes' 
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {error && (
          <div className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-2" />
              <p className="text-error dark:text-error/30 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!useBackupCode ? (
          <div className="space-y-4">
            {/* Token Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
                <button
                  onClick={refreshToken}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                <span>Code refreshes in {timeRemaining}s</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleTokenVerification}
                disabled={isLoading || token.length !== 6}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify Code</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setUseBackupCode(true)}
                className="w-full px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Use backup code instead
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Backup Code Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={8}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBackupCodeVerification}
                disabled={isLoading || backupCode.length !== 8}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Verify Backup Code</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setUseBackupCode(false)}
                className="w-full px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Use authenticator app instead
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-start">
            <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-0.5" />
            <div className="text-sm text-primary-800 dark:text-primary-300">
              <p className="font-medium mb-1">Need help?</p>
              <p>Make sure your device's time is synchronized. If you're still having trouble, contact support.</p>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-secondary-800 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

export default TwoFactorVerification;
