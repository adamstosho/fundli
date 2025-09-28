import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    sms: false,
    types: {
      loan_updates: true,
      payment_reminders: true,
      kyc_status: true,
      investment_updates: true,
      system_announcements: true,
      security_alerts: true,
      referral_rewards: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('https://fundli-hjqn.vercel.app/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPreferences(result.data.preferences);
      } else {
        // Use default preferences if API fails
        console.log('Using default notification preferences');
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('https://fundli-hjqn.vercel.app/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailNotifications: preferences.email,
          pushNotifications: preferences.push,
          smsNotifications: preferences.sms,
          notificationTypes: Object.keys(preferences.types).filter(key => preferences.types[key])
        })
      });

      if (response.ok) {
        setSuccess('Notification preferences saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelToggle = (channel) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const handleTypeToggle = (type) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type]
      }
    }));
  };

  const notificationTypes = [
    { key: 'loan_updates', label: 'Loan Updates', description: 'Application status, approvals, rejections' },
    { key: 'payment_reminders', label: 'Payment Reminders', description: 'Due dates, overdue payments' },
    { key: 'kyc_status', label: 'KYC Status', description: 'Verification approvals and rejections' },
    { key: 'investment_updates', label: 'Investment Updates', description: 'New opportunities, returns' },
    { key: 'system_announcements', label: 'System Announcements', description: 'Maintenance, new features' },
    { key: 'security_alerts', label: 'Security Alerts', description: 'Login attempts, account security' },
    { key: 'referral_rewards', label: 'Referral Rewards', description: 'Referral completions and rewards' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center">
            <Settings className="h-6 w-6 mr-3 text-primary-600" />
            Notification Preferences
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Customize how and when you receive notifications
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success rounded-lg p-4"
        >
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-success dark:text-success/50 mr-2" />
            <span className="text-success dark:text-success/30">{success}</span>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-2" />
            <span className="text-error dark:text-error/30">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Notification Channels */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Notification Channels
        </h3>
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-primary-600" />
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white">Email Notifications</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <button
              onClick={() => handleChannelToggle('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.email ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-success" />
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white">Push Notifications</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => handleChannelToggle('push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.push ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-accent-600" />
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white">SMS Notifications</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Receive text message notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => handleChannelToggle('sms')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.sms ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.sms ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Notification Types
        </h3>
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-secondary-900 dark:text-white">{type.label}</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{type.description}</p>
              </div>
              <button
                onClick={() => handleTypeToggle(type.key)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  preferences.types[type.key] ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    preferences.types[type.key] ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
