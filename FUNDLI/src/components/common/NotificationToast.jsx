import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  User,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react';

const NotificationToast = ({ notification, onClose, onAction }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'loan_application':
        return <Bell className="h-5 w-5 text-blue-600" />;
      case 'loan_approval':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'loan_rejection':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'loan_funding':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'repayment_due':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'repayment_received':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'investment_opportunity':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'kyc_approval':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'kyc_rejection':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'referral_completed':
        return <User className="h-5 w-5 text-purple-600" />;
      case 'referral_reward':
        return <DollarSign className="h-5 w-5 text-purple-600" />;
      case 'system_announcement':
        return <Bell className="h-5 w-5 text-blue-600" />;
      case 'security_alert':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'payment_failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'account_verification':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'welcome_message':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'loan_approval':
      case 'loan_funding':
      case 'repayment_received':
      case 'kyc_approval':
      case 'welcome_message':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'loan_rejection':
      case 'kyc_rejection':
      case 'payment_failed':
      case 'security_alert':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'repayment_due':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'investment_opportunity':
      case 'loan_application':
      case 'account_verification':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'referral_completed':
      case 'referral_reward':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const handleAction = () => {
    if (notification.action && notification.action.type !== 'none') {
      onAction(notification.action);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed top-4 right-4 w-96 max-w-sm z-50 border-l-4 rounded-lg shadow-lg ${getNotificationColor(notification.type)}`}
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {notification.title}
                  </h4>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {notification.message}
                </p>
                
                {/* Additional Details */}
                {notification.metadata && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {notification.metadata.amount && (
                      <span className="font-medium">
                        Amount: ${notification.metadata.amount.toLocaleString()}
                      </span>
                    )}
                    {notification.metadata.dueDate && (
                      <span className="ml-2">
                        Due: {new Date(notification.metadata.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Action Button */}
                {notification.action && notification.action.type !== 'none' && (
                  <button
                    onClick={handleAction}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {notification.action.buttonText || 'View Details'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress bar for auto-close */}
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-blue-500"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NotificationToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewNotification = (event) => {
      const notification = event.detail;
      
      // Only show toast for high priority notifications or if user preferences allow
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        setToasts(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          notification 
        }]);
      }
    };

    window.addEventListener('notificationAdded', handleNewNotification);
    return () => window.removeEventListener('notificationAdded', handleNewNotification);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleAction = (action) => {
    if (action.url) {
      // Navigate to the URL
      window.location.href = action.url;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast.notification}
          onClose={() => removeToast(toast.id)}
          onAction={handleAction}
        />
      ))}
    </div>
  );
};

export default NotificationToastContainer;
