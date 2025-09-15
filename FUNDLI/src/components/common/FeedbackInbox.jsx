import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Mail,
  Phone,
  Building,
  DollarSign,
  FileText,
  ArrowRight,
  Plus,
  Eye,
  Reply,
  Trash2,
  Filter,
  Search,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FeedbackInbox = ({ onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'replied', 'sent'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showMessageDetails, setShowMessageDetails] = useState(false);
  const [replyForm, setReplyForm] = useState({
    message: '',
    subject: ''
  });

  useEffect(() => {
    console.log('=== FeedbackInbox useEffect ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('user._id:', user?._id);
    console.log('user.id:', user?.id);
    
    // Always try to load feedback - the loadFeedback function will handle authentication checks
    console.log('Attempting to load feedback...');
    loadFeedback();
  }, [isAuthenticated, user]);

  // Also try to load feedback when component first mounts
  useEffect(() => {
    console.log('=== FeedbackInbox Mount ===');
    // Small delay to allow AuthContext to initialize
    const timer = setTimeout(() => {
      loadFeedback();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== FeedbackInbox Debug ===');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('user:', user);
      console.log('user._id:', user?._id);
      console.log('user.id:', user?.id);
      
      // Check if user is authenticated - try AuthContext first, then fallback to localStorage
      let currentUser = user;
      let currentUserId = user?._id || user?.id; // Handle both _id and id fields
      
      if (!isAuthenticated || !currentUser || !currentUserId) {
        console.log('AuthContext not ready, checking localStorage...');
        
        // Fallback to localStorage
        const userData = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        console.log('LocalStorage user data:', userData ? 'Found' : 'Not found');
        console.log('LocalStorage access token:', accessToken ? 'Found' : 'Not found');
        
        if (userData && accessToken) {
          try {
            currentUser = JSON.parse(userData);
            currentUserId = currentUser._id || currentUser.id; // Handle both _id and id fields
            console.log('Using localStorage user:', currentUser.email, 'ID:', currentUserId);
            console.log('User object keys:', Object.keys(currentUser));
          } catch (parseError) {
            console.error('Error parsing user data from localStorage:', parseError);
          }
        }
      }
      
      // Final check
      if (!currentUserId) {
        console.log('No valid user ID found');
        setError('Please log in to view your feedback');
        return;
      }
      
      console.log('Loading feedback for user:', currentUserId);
      console.log('API request URL:', `/feedback/user/${currentUserId}`);
      
      const response = await api.get(`/feedback/user/${currentUserId}`);
      console.log('Feedback response:', response.data);
      console.log('Feedback data:', response.data.data);
      console.log('Feedback array:', response.data.data?.feedback);
      
      const feedbackData = response.data.data?.feedback || [];
      console.log('Setting feedback data:', feedbackData);
      console.log('First feedback item structure:', feedbackData[0]);
      
      setFeedback(feedbackData);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyToFeedback = async (feedbackId) => {
    if (!replyForm.message) {
      setError('Please enter a reply message');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      console.log('=== Sending Reply ===');
      console.log('Feedback ID:', feedbackId);
      console.log('Reply message:', replyForm.message);
      console.log('Reply subject:', replyForm.subject);
      
      const response = await api.post(`/feedback/${feedbackId}/reply`, {
        message: replyForm.message,
        subject: replyForm.subject
      });

      console.log('Reply response:', response.data);

      setSuccess('Reply sent successfully!');
      setShowSuccessModal(true);
      console.log('Success modal should be showing now');
      setReplyForm({ message: '', subject: '' });
      setSelectedFeedback(null);
      await loadFeedback();
      
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        console.log('Hiding success modal after 3 seconds');
        setShowSuccessModal(false);
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error sending reply:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (feedbackId) => {
    try {
      await api.put(`/feedback/${feedbackId}/read`);
      await loadFeedback();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'read': return 'text-purple-600 bg-purple-100';
      case 'replied': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredFeedback = feedback.filter(fb => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && (fb.status === 'sent' || fb.status === 'delivered')) ||
      (filter === 'replied' && fb.status === 'replied') ||
      (filter === 'sent' && fb.sender._id === localStorage.getItem('userId'));
    
    const matchesSearch = searchTerm === '' || 
      fb.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = feedback.filter(fb => fb.status === 'sent' || fb.status === 'delivered').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Feedback Inbox
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount > 0 && `${unreadCount} unread messages`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All', count: feedback.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'replied', label: 'Replied', count: feedback.filter(fb => fb.status === 'replied').length },
                { id: 'sent', label: 'Sent', count: feedback.filter(fb => fb.sender._id === localStorage.getItem('userId')).length }
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === filterOption.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterOption.label} ({filterOption.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((fb) => {
                console.log('Rendering feedback item:', fb);
                console.log('Feedback recipient:', fb.recipient);
                console.log('Current user:', user);
                console.log('User ID comparison:', fb.recipient?.id, '===', (user?._id || user?.id));
                
                return (
                <div
                  key={fb.id}
                  className={`bg-white dark:bg-gray-700 border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    fb.status === 'sent' || fb.status === 'delivered' 
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900' 
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          fb.status === 'sent' || fb.status === 'delivered'
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          <MessageSquare className={`h-5 w-5 ${
                            fb.status === 'sent' || fb.status === 'delivered'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {fb.subject}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fb.sender._id === localStorage.getItem('userId') ? 'To' : 'From'}: {fb.sender.name} ({fb.sender.userType})
                        </p>
                        {fb.loan && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Loan: {fb.loan.purpose} - ${fb.loan.amount?.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(fb.priority)}`}>
                        {fb.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fb.status)}`}>
                        {fb.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {fb.message}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                      {fb.replyDeadline && (
                        <span className="flex items-center text-orange-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Deadline: {new Date(fb.replyDeadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Debug info */}
                      <div className="text-xs text-gray-400">
                        Debug: recipient.id={fb.recipient?.id}, user.id={user?._id || user?.id}
                      </div>
                      
                      {/* Always show buttons for debugging */}
                      <button
                        onClick={() => {
                          console.log('Mark as Read clicked for feedback:', fb);
                          markAsRead(fb.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        Mark as Read
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('View Details clicked for feedback:', fb);
                          setSelectedFeedback(fb);
                          setShowMessageDetails(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center px-3 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Details Modal */}
        {selectedFeedback && showMessageDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Message Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    From: {selectedFeedback.sender?.name || 'Admin'} ({selectedFeedback.sender?.email})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMessageDetails(false);
                    setSelectedFeedback(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {selectedFeedback.subject}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[120px] whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </div>
                  </div>
                  
                  {selectedFeedback.priority && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedFeedback.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          selectedFeedback.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                          selectedFeedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {selectedFeedback.priority.charAt(0).toUpperCase() + selectedFeedback.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowMessageDetails(false);
                      setSelectedFeedback(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowMessageDetails(false);
                      setReplyForm({
                        message: '',
                        subject: `Re: ${selectedFeedback.subject}`
                      });
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Reply className="h-4 w-4" />
                    <span>Reply to Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {selectedFeedback && !showMessageDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reply to Admin
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Replying to: {selectedFeedback.subject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    From: {selectedFeedback.sender?.name || 'Admin'} • {new Date(selectedFeedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Original Message Preview */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Original message from {selectedFeedback.sender?.name || 'Admin'}:</strong>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">
                      {selectedFeedback.subject}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={replyForm.subject}
                      onChange={(e) => setReplyForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder={`Re: ${selectedFeedback.subject}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Reply *
                    </label>
                    <textarea
                      value={replyForm.message}
                      onChange={(e) => setReplyForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Enter your reply message..."
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReplyToFeedback(selectedFeedback.id)}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Reply className="h-4 w-4" />
                    )}
                    <span>{isLoading ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Success!
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {success}
                </p>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Great!</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FeedbackInbox;
