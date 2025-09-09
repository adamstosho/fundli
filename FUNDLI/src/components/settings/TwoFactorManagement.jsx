import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, AlertCircle, CheckCircle, Eye, EyeOff, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TwoFactorManagement = () => {
  const { user } = useAuth();
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorStatus(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch 2FA status');
      }
    } catch (error) {
      setError('Failed to fetch 2FA status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!disableToken || disableToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsDisabling(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: disableToken })
      });

      if (response.ok) {
        setSuccess('Two-factor authentication has been disabled successfully');
        setDisableToken('');
        await fetchTwoFactorStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setIsDisabling(false);
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/2fa/regenerate-backup-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorStatus(prev => ({
          ...prev,
          backupCodes: data.data.backupCodes,
          backupCodesCount: data.data.backupCodes.length
        }));
        setSuccess('New backup codes generated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to regenerate backup codes');
      }
    } catch (error) {
      setError('Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!twoFactorStatus?.backupCodes) return;
    
    const codesText = twoFactorStatus.backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fundli-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account security settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            twoFactorStatus?.enabled 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {twoFactorStatus?.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* 2FA Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Authenticator App
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {twoFactorStatus?.enabled 
                  ? 'Two-factor authentication is enabled for your account'
                  : 'Add an extra layer of security to your account'
                }
              </p>
              {twoFactorStatus?.enabled && twoFactorStatus?.enabledAt && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Enabled on {new Date(twoFactorStatus.enabledAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Backup Codes Status */}
        {twoFactorStatus?.enabled && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Backup Codes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {twoFactorStatus.backupCodesCount || 0} codes remaining
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showBackupCodes ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Show</span>
                    </>
                  )}
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={regenerateBackupCodes}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {showBackupCodes && twoFactorStatus.backupCodes && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {twoFactorStatus.backupCodes.map((code, index) => (
                  <div key={index} className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono">
                    {code}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disable 2FA Section */}
      {twoFactorStatus?.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Disable Two-Factor Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                This will remove the extra security layer from your account. We recommend keeping 2FA enabled.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter verification code to disable 2FA
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={disableToken}
                    onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center font-mono"
                    maxLength={6}
                  />
                  <button
                    onClick={handleDisableTwoFactor}
                    disabled={isDisabling || disableToken.length !== 6}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDisabling ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
          Security Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <li>• Keep your authenticator app updated</li>
          <li>• Store backup codes in a secure location</li>
          <li>• Never share your 2FA codes with anyone</li>
          <li>• Use a strong, unique password for your account</li>
          <li>• Enable 2FA on all your important accounts</li>
        </ul>
      </div>
    </div>
  );
};

export default TwoFactorManagement;
