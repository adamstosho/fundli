import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import pushNotificationService from '../../services/pushNotificationService';

const PushNotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    initializeNotifications();
    loadNotificationHistory();
  }, []);

  const initializeNotifications = async () => {
    try {
      const supported = await pushNotificationService.initialize();
      setIsSupported(supported);
      
      if (supported) {
        const subscribed = pushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);
        
        const permission = pushNotificationService.getPermissionStatus();
        setPermissionStatus(permission);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setError('Failed to initialize push notifications');
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      setPermissionStatus('granted');
      setSuccess('Push notifications enabled successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      setSuccess('Push notifications disabled successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to disable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    pushNotificationService.showNotification('Test Notification', {
      body: 'This is a test notification from FUNDLI',
      icon: '/icon-192x192.png'
    });
  };

  const clearError = () => setError('');
  const clearSuccess = () => setSuccess('');

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-200">
              Push Notifications Not Supported
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
              Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Push Notifications
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your notification preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isSubscribed ? (
            <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <BellOff className="h-6 w-6 text-gray-400" />
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isSubscribed 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {isSubscribed ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
            </div>
            <button
              onClick={clearSuccess}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
            <Bell className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Browser Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Receive real-time notifications about loan updates, payments, and important account activities.
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {permissionStatus === 'granted' 
                      ? 'Notifications are allowed'
                      : permissionStatus === 'denied'
                      ? 'Notifications are blocked'
                      : 'Permission not requested'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {isSubscribed ? (
                    <button
                      onClick={handleUnsubscribe}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <BellOff className="h-4 w-4" />
                      <span>{isLoading ? 'Disabling...' : 'Disable'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSubscribe}
                      disabled={isLoading || permissionStatus === 'denied'}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Bell className="h-4 w-4" />
                      <span>{isLoading ? 'Enabling...' : 'Enable'}</span>
                    </button>
                  )}
                  
                  {isSubscribed && (
                    <button
                      onClick={testNotification}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Loan Updates</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Application status, approvals, disbursements</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Payment Reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due dates, successful payments</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Account Activity</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">KYC updates, security alerts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Marketplace</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">New opportunities, matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Notifications
          </h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notification.body}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
          About Push Notifications
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <li>• Notifications are sent directly to your browser</li>
          <li>• You can disable them anytime from your browser settings</li>
          <li>• We only send important updates and never spam</li>
          <li>• Notifications work even when the app is closed</li>
          <li>• Your privacy is protected - we don't track personal data</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
