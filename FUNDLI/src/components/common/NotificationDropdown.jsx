import { useState, useEffect, useRef, useCallback } from 'react';
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
  Eye,
  X,
  ChevronDown
} from 'lucide-react';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, loan_updates, system
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const dropdownRef = useRef(null);

  // Stable function to close modal
  const closeModal = useCallback(() => {
    setShowDetailsModal(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Listen for new notifications
  useEffect(() => {
    const handleNewNotification = (event) => {
      const newNotification = event.detail;
      setNotifications(prev => [newNotification, ...prev]);
    };

    window.addEventListener('notificationAdded', handleNewNotification);
    return () => window.removeEventListener('notificationAdded', handleNewNotification);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Try to load from backend first
      try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('https://fundli-hjqn.vercel.app/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const backendNotifications = result.data.notifications || [];
          
          // Also load local notifications
          const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
          
          // Combine and sort by date
          const allNotifications = [...backendNotifications, ...localNotifications]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setNotifications(allNotifications);
          return;
        }
      } catch (backendError) {
        console.log('Backend notifications not available, using local storage');
      }
      
      // Fallback to local storage only
      const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      setNotifications(localNotifications);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Check if it's a local notification
      if (notificationId.startsWith('local_')) {
        // Update local storage
        const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
        const updatedNotifications = localNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        );
        localStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
        
        // Update state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        return;
      }

      // Try backend for non-local notifications
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/notifications/${notificationId}/read`, {
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
      // Check if it's a local notification
      if (notificationId.startsWith('local_')) {
        // Update local storage
        const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
        const updatedNotifications = localNotifications.filter(notif => notif.id !== notificationId);
        localStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
        
        // Update state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        return;
      }

      // Try backend for non-local notifications
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/notifications/${notificationId}`, {
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
      case 'loan_funded':
        return <DollarSign className="h-4 w-4 text-success" />;
      case 'loan_approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'loan_rejected':
        return <XCircle className="h-4 w-4 text-error" />;
      case 'loan_pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'payment_due':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'system':
        return <Bell className="h-4 w-4 text-primary-600" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'loan_funded':
        return 'border-l-green-500 bg-success/10 dark:bg-success/10';
      case 'loan_approved':
        return 'border-l-green-500 bg-success/10 dark:bg-success/10';
      case 'loan_rejected':
        return 'border-l-red-500 bg-error/10 dark:bg-error/10';
      case 'loan_pending':
        return 'border-l-yellow-500 bg-warning/10 dark:bg-warning/10';
      case 'payment_due':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'system':
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Dropdown */}
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-secondary-700 z-50 max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-error text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1 mt-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'loan_funded', label: 'Funded' },
              { key: 'loan_rejected', label: 'Rejected' },
              { key: 'system', label: 'System' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4">
              <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
              <p className="text-error dark:text-error/50 text-sm">{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-secondary-900 dark:text-white mb-1">
                No Notifications
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {filter === 'unread' 
                  ? 'You have no unread notifications.'
                  : 'You have no notifications at this time.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    } hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h5 className={`text-sm font-semibold ${
                            !notification.isRead 
                              ? 'text-secondary-900 dark:text-white' 
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {notification.title}
                          </h5>
                          <div className="flex items-center space-x-2 ml-2">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                            )}
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-xs ${
                          !notification.isRead 
                            ? 'text-neutral-800 dark:text-neutral-200' 
                            : 'text-neutral-600 dark:text-neutral-400'
                        } mb-2 line-clamp-2`}>
                          {notification.message}
                        </p>
                        
                        {/* Additional Details for Loan Notifications */}
                        {notification.type === 'loan_rejected' && notification.metadata?.reason && (
                          <div className="bg-error/20 dark:bg-error/20 rounded-lg p-2 mb-2">
                            <p className="text-xs text-error dark:text-error/30">
                              <strong>Reason:</strong> {notification.metadata.reason}
                            </p>
                          </div>
                        )}
                        
                        {notification.type === 'loan_approved' && notification.metadata && (
                          <div className="bg-success/20 dark:bg-success/20 rounded-lg p-2 mb-2">
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div>
                                <span className="text-success dark:text-success/30 font-medium">Amount:</span>
                                <span className="text-success dark:text-success/40 ml-1">
                                  ${notification.metadata.amount?.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-success dark:text-success/30 font-medium">Duration:</span>
                                <span className="text-success dark:text-success/40 ml-1">
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
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium flex items-center space-x-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>
                          
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white text-xs font-medium"
                            >
                              Mark Read
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-error dark:text-error/50 hover:text-error dark:hover:text-error/40 text-xs font-medium flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
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
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-neutral-200 dark:border-secondary-700 bg-neutral-50 dark:bg-neutral-700/50">
            <button
              onClick={() => {
                // Mark all as read functionality
                filteredNotifications.forEach(notif => {
                  if (!notif.isRead) {
                    markAsRead(notif.id);
                  }
                });
              }}
              className="w-full text-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Mark All as Read
            </button>
          </div>
        )}
      </motion.div>

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
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center">
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
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
                  {selectedNotification.title}
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  {selectedNotification.message}
                </p>
              </div>
              
              {selectedNotification.metadata && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h5 className="font-medium text-secondary-900 dark:text-white mb-3 text-sm">Additional Information</h5>
                  <div className="space-y-2">
                    {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400 capitalize">
                          {key.replace(/([A-Z])/g, ' ₦1').trim()}:
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-white">
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
              
              <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-secondary-700">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Received: {new Date(selectedNotification.createdAt).toLocaleString()}
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeModal();
                    }}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm"
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
    </>
  );
};

export default NotificationDropdown;
