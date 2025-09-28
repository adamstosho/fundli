import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  MoreVertical,
  DollarSign,
  XCircle
} from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fundingLoan, setFundingLoan] = useState(null);
  const [rejectingLoan, setRejectingLoan] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      if (!user.userType) {
        setError('No user type found');
        return;
      }
      
      // Use different endpoints based on user type
      let endpoint;
      if (user.userType === 'lender') {
        endpoint = 'https://fundli-hjqn.vercel.app/api/lender/notifications';
      } else if (user.userType === 'admin') {
        endpoint = 'https://fundli-hjqn.vercel.app/api/admin/notifications';
      } else {
        endpoint = 'https://fundli-hjqn.vercel.app/api/notifications';
      }
      
      console.log('🔔 Loading notifications for user type:', user.userType);
      console.log('🔔 Using endpoint:', endpoint);
      console.log('🔔 User data:', user);
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🔔 Notifications response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Notifications data:', data);
        console.log('🔔 Notifications count:', data.data?.notifications?.length || 0);
        console.log('🔔 Notifications details:', data.data?.notifications?.map(n => ({ id: n._id, title: n.title, type: n.type })));
        setNotifications(data.data.notifications || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Notifications error:', errorText);
        console.error('❌ Notifications status:', response.status);
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleFundLoan = async (loanId, loanAmount, borrowerName) => {
    try {
      setFundingLoan(loanId);
      const token = localStorage.getItem('accessToken');
      
      // Check if user has sufficient balance
      const walletResponse = await fetch('https://fundli-hjqn.vercel.app/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        const wallet = walletData.data;
        
        if (wallet.balance < loanAmount) {
          alert(`Insufficient balance. Required: ₦${loanAmount.toLocaleString()}, Available: ₦${wallet.balance.toLocaleString()}`);
          return;
        }
      }
      
      // Confirm funding
      const confirmed = window.confirm(
        `Are you sure you want to fund this loan?\n\n` +
        `Amount: ₦${loanAmount.toLocaleString()}\n` +
        `Borrower: ${borrowerName}`
      );
      
      if (!confirmed) return;
      
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/loans/${loanId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentReference: `FUND_${loanId}_${Date.now()}`,
          amount: loanAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Loan funded successfully! ${result.message}`);
        await loadNotifications(); // Refresh notifications
      } else {
        const errorData = await response.json();
        alert(`Failed to fund loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error funding loan:', error);
      alert('Failed to fund loan. Please try again.');
    } finally {
      setFundingLoan(null);
    }
  };

  const handleRejectLoan = async (loanId, borrowerName) => {
    try {
      setRejectingLoan(loanId);
      
      const rejectionReason = prompt(
        `Please provide a reason for rejecting this loan application from ${borrowerName}:`
      );
      
      if (!rejectionReason || rejectionReason.trim() === '') {
        alert('Rejection reason is required.');
        return;
      }
      
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/loans/${loanId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Loan rejected successfully. ${result.message}`);
        await loadNotifications(); // Refresh notifications
      } else {
        const errorData = await response.json();
        alert(`Failed to reject loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Failed to reject loan. Please try again.');
    } finally {
      setRejectingLoan(null);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/notifications/${notificationId}/unread`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: false }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fundli-hjqn.vercel.app/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };


  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary-600" />;
      case 'new_user_registration':
        return <Bell className="h-5 w-5 text-blue-600" />;
      case 'new_loan_pool':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'new_loan_application':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'loan_funded':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'loan_repayment':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'loan_due_for_repayment':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-success/10 dark:bg-success/20';
      case 'error':
        return 'border-l-red-500 bg-error/10 dark:bg-error/20';
      case 'warning':
        return 'border-l-yellow-500 bg-warning/10 dark:bg-warning/20';
      case 'info':
        return 'border-l-blue-500 bg-primary-50 dark:bg-primary-900/20';
      case 'new_user_registration':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'new_loan_pool':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'new_loan_application':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'loan_funded':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'loan_repayment':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'loan_due_for_repayment':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-l-gray-500 bg-neutral-50 dark:bg-secondary-900/20';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead);
    
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center">
                <Bell className="h-8 w-8 mr-3 text-primary-600" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-3 bg-error text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                Stay updated with your account activities
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshNotifications}
                disabled={refreshing}
                className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-white dark:bg-secondary-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'read', label: 'Read', count: notifications.length - unreadCount }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-white dark:bg-neutral-600 text-secondary-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white w-full md:w-64"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-error dark:text-error/50 mr-2" />
              <span className="text-error dark:text-error/30">{error}</span>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                {filter === 'all' 
                  ? 'You\'ll see notifications about your account activities here.'
                  : `You don't have any ${filter} notifications at the moment.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-l-4 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                  notification.isRead 
                    ? 'bg-white dark:bg-secondary-800 border-neutral-200 dark:border-secondary-700' 
                    : `${getNotificationColor(notification.type)} border-neutral-200 dark:border-secondary-700`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-medium ${
                          notification.isRead 
                            ? 'text-neutral-600 dark:text-neutral-400' 
                            : 'text-secondary-900 dark:text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        notification.isRead 
                          ? 'text-neutral-500 dark:text-neutral-500' 
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {notification.type && (
                          <span className="capitalize">{notification.type}</span>
                        )}
                      </div>
                      
                      {/* Action buttons for loan approval notifications */}
                      {notification.type === 'loan_approval' && notification.metadata?.loanId && (
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => handleFundLoan(
                              notification.metadata.loanId,
                              notification.metadata.amount,
                              notification.metadata.borrowerName || 'Borrower'
                            )}
                            disabled={fundingLoan === notification.metadata.loanId}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-success hover:bg-success disabled:bg-success/50 text-white text-xs rounded-md transition-colors"
                          >
                            <DollarSign className="h-3 w-3" />
                            <span>{fundingLoan === notification.metadata.loanId ? 'Funding...' : 'Fund Loan'}</span>
                          </button>
                          <button
                            onClick={() => handleRejectLoan(
                              notification.metadata.loanId,
                              notification.metadata.borrowerName || 'Borrower'
                            )}
                            disabled={rejectingLoan === notification.metadata.loanId}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-error hover:bg-error disabled:bg-error/50 text-white text-xs rounded-md transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>{rejectingLoan === notification.metadata.loanId ? 'Rejecting...' : 'Reject Loan'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.isRead ? (
                      <button
                        onClick={() => markAsUnread(notification._id)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        title="Mark as unread"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-1 text-neutral-400 hover:text-error transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
