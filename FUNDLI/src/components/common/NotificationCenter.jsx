import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../../utils/config';
import { createPortal } from 'react-dom';
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
  Trash2,
  Eye
} from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, loan_updates, system
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Stable function to close modal
  const closeModal = useCallback(() => {
    setShowDetailsModal(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(buildApiUrl('/notifications'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data.notifications || []);
      } else {
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(buildApiUrl(`/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(buildApiUrl(`/notifications/${notificationId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'loan_approved':
      case 'loan_approval':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'loan_rejected':
      case 'loan_rejection':
        return <XCircle className="h-5 w-5 text-error" />;
      case 'loan_pending':
      case 'loan_application':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'payment_due':
      case 'repayment_due':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'system':
      case 'system_announcement':
        return <Bell className="h-5 w-5 text-primary-600" />;
      case 'money_received':
        return <DollarSign className="h-5 w-5 text-success" />;
      case 'money_sent':
        return <DollarSign className="h-5 w-5 text-primary-600" />;
      case 'loan_funding':
        return <DollarSign className="h-5 w-5 text-success" />;
      case 'loan_funded':
        return <DollarSign className="h-5 w-5 text-success" />;
      case 'investment_successful':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'repayment_received':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'loan_approved':
      case 'loan_approval':
      case 'money_received':
      case 'loan_funding':
      case 'loan_funded':
      case 'investment_successful':
      case 'repayment_received':
        return 'border-l-green-500 bg-success/10 dark:bg-success/10';
      case 'loan_rejected':
      case 'loan_rejection':
        return 'border-l-red-500 bg-error/10 dark:bg-error/10';
      case 'loan_pending':
      case 'loan_application':
        return 'border-l-yellow-500 bg-warning/10 dark:bg-warning/10';
      case 'payment_due':
      case 'repayment_due':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'system':
      case 'system_announcement':
      case 'money_sent':
        return 'border-l-blue-500 bg-primary-50 dark:bg-primary-900/10';
      default:
        return 'border-l-gray-500 bg-neutral-50 dark:bg-secondary-900/10';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
        <p className="text-error dark:text-error/50">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h3 text-neutral-900 dark:text-white">
            Notifications
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Stay updated on your loan applications and account activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          {unreadCount > 0 && (
            <span className="bg-error text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'loan_updates', label: 'Loan Updates' },
          { key: 'system', label: 'System' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Notifications
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            {filter === 'unread' 
              ? 'You have no unread notifications.'
              : 'You have no notifications at this time.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`card p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-semibold ${
                        !notification.isRead 
                          ? 'text-neutral-900 dark:text-white' 
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm ${
                      !notification.isRead 
                        ? 'text-neutral-800 dark:text-neutral-200' 
                        : 'text-neutral-600 dark:text-neutral-400'
                    } mb-3`}>
                      {notification.message}
                    </p>
                    
                    {/* Additional Details for Loan Notifications */}
                    {notification.type === 'loan_rejected' && notification.metadata?.reason && (
                      <div className="bg-error/20 dark:bg-error/20 rounded-lg p-3 mb-3">
                        <p className="text-sm text-error dark:text-error/30">
                          <strong>Reason:</strong> {notification.metadata.reason}
                        </p>
                      </div>
                    )}
                    
                    {notification.type === 'loan_approved' && notification.metadata && (
                      <div className="bg-success/20 dark:bg-success/20 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-success dark:text-success/30 font-medium">Amount:</span>
                            <span className="text-success dark:text-success/40 ml-2">
                              ${notification.metadata.amount?.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-success dark:text-success/30 font-medium">Duration:</span>
                            <span className="text-success dark:text-success/40 ml-2">
                              {notification.metadata.duration} months
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDetailsModal(true);
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium"
                        >
                          Mark as Read
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-error dark:text-error/50 hover:text-error dark:hover:text-error/40 text-sm font-medium flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Notification Details Modal - Rendered via Portal */}
      {showDetailsModal && selectedNotification && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              closeModal();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                {getNotificationIcon(selectedNotification.type)}
                <span className="ml-2">Notification Details</span>
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeModal();
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
                  {selectedNotification.title}
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {selectedNotification.message}
                </p>
              </div>
              
              {selectedNotification.metadata && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h5 className="font-medium text-neutral-900 dark:text-white mb-3">Additional Information</h5>
                  <div className="space-y-2">
                    {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400 capitalize">
                          {key.replace(/([A-Z])/g, ' ₦1').trim()}:
                        </span>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {typeof value === 'number' && key.includes('amount') 
                            ? `₦${value.toLocaleString()}` 
                            : value
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Received: {new Date(selectedNotification.createdAt).toLocaleString()}
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeModal();
                    }}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationCenter;
