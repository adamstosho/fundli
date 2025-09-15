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
  X
} from 'lucide-react';
import api from '../../services/api';

const FeedbackManagement = ({ loanId, loanData, onClose }) => {
  const [activeTab, setActiveTab] = useState('view'); // Start with 'view' tab for chat interface
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Send feedback form state
  const [sendForm, setSendForm] = useState({
    recipientType: loanData?.recipientType || 'borrower', // 'borrower' or 'lender'
    recipientId: (loanData?.borrower?._id && loanData.borrower._id !== 'general') ? loanData.borrower._id : 
                 (loanData?.lender?._id && loanData.lender._id !== 'general') ? loanData.lender._id : '',
    subject: `Re: ${loanData?.purpose || 'Loan Application'}`,
    message: '',
    priority: 'medium',
    replyDeadline: ''
  });

  // View feedback state
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyForm, setReplyForm] = useState({
    message: '',
    subject: ''
  });

  useEffect(() => {
    if (loanId) {
      loadFeedback();
    }
    // Load available users for general feedback
    if (loanId === 'general-feedback' || !loanId) {
      loadAvailableUsers();
    }
  }, [loanId]);

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== Admin Loading Feedback ===');
      console.log('Loan ID:', loanId);
      
      // Check authentication first
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Auth Token exists:', !!token);
      console.log('User data:', user);
      console.log('User type:', user.userType);
      
      if (!token) {
        setError('Please log in to access feedback management.');
        return;
      }
      
      if (user.userType !== 'admin') {
        setError('Only admin users can access feedback management.');
        return;
      }
      
      // Always try to load all feedback for admin (chat-like interface)
      try {
        const response = await api.get('/feedback');
        console.log('All feedback response:', response.data);
        const feedbackData = response.data.data?.feedback || [];
        console.log('Admin feedback data:', feedbackData);
        console.log('Number of feedback items:', feedbackData.length);
        
        // Debug: Log each feedback item
        feedbackData.forEach((fb, index) => {
          console.log(`Feedback ${index + 1}:`, {
            id: fb.id,
            type: fb.type,
            subject: fb.subject,
            message: fb.message?.substring(0, 50) + '...',
            sender: fb.sender?.userType,
            isReply: fb.isReply,
            createdAt: fb.createdAt
          });
        });
        
        setFeedback(feedbackData);
      } catch (apiError) {
        console.error('Error loading all feedback:', apiError);
        console.error('API Error details:', apiError.response?.data);
        
        if (apiError.response?.status === 403) {
          setError('Access denied. Please ensure you are logged in as an admin user.');
        } else if (apiError.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(`Failed to load feedback: ${apiError.response?.data?.message || apiError.message}`);
        }
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      // Load users from the admin API
      const response = await api.get('/admin/users');
      setAvailableUsers(response.data.data?.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
      // Don't show error for users, just log it
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    
    if (!sendForm.recipientId || !sendForm.subject || !sendForm.message) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const feedbackData = {
        recipient: sendForm.recipientId,
        subject: sendForm.subject,
        message: sendForm.message,
        priority: sendForm.priority,
        deadline: sendForm.replyDeadline || null
      };

      // Add loan reference if available
      if (loanId && loanId !== 'general-feedback') {
        feedbackData.loan = loanId;
      }

      console.log('Sending feedback data:', feedbackData);
      
      const response = await api.post('/feedback', feedbackData);
      
      setSuccess('Feedback sent successfully!');
      setShowSuccessModal(true);
      setSendForm({
        recipientType: loanData?.recipientType || 'borrower',
        recipientId: loanData?.borrower?._id || loanData?.lender?._id || '',
        subject: `Re: ${loanData?.purpose || 'Loan Application'}`,
        message: '',
        priority: 'medium',
        replyDeadline: ''
      });
      
      // Reload feedback to show the new message
      await loadFeedback();
      
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error sending feedback:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Failed to send feedback');
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
      
      const response = await api.post(`/feedback/${feedbackId}/reply`, {
        message: replyForm.message
      });

      setSuccess('Reply sent successfully!');
      setShowSuccessModal(true);
      setReplyForm({ message: '', subject: '' });
      setSelectedFeedback(null);
      await loadFeedback();
      
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error sending reply:', err);
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
                Feedback Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loan: {loanData?.purpose} - ${loanData?.loanAmount?.toLocaleString()}
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'send', label: 'Send Feedback', icon: Send },
            { id: 'view', label: 'View Feedback', icon: Eye },
            { id: 'stats', label: 'Statistics', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
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

          {/* Send Feedback Tab */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Send Feedback
                </h3>
                
                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recipient Type
                      </label>
                      <select
                        value={sendForm.recipientType}
                        onChange={(e) => setSendForm(prev => ({ ...prev, recipientType: e.target.value, recipientId: '' }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      >
                        <option value="borrower">Borrower</option>
                        <option value="lender">Lender</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recipient
                        {loadingUsers && <span className="text-sm text-gray-500 ml-2">(Loading users...)</span>}
                      </label>
                      <select
                        value={sendForm.recipientId}
                        onChange={(e) => setSendForm(prev => ({ ...prev, recipientId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        required
                        disabled={loadingUsers}
                      >
                        <option value="">Select {sendForm.recipientType}</option>
                        
                        {/* Show specific borrower/lender if available and not general */}
                        {sendForm.recipientType === 'borrower' && loanData?.borrower && loanData.borrower._id !== 'general' && (
                          <option value={loanData.borrower._id}>
                            {loanData.borrower.firstName} {loanData.borrower.lastName} ({loanData.borrower.email})
                          </option>
                        )}
                        {sendForm.recipientType === 'lender' && loanData?.lender && loanData.lender._id !== 'general' && (
                          <option value={loanData.lender._id}>
                            {loanData.lender.firstName} {loanData.lender.lastName} ({loanData.lender.email})
                          </option>
                        )}
                        
                        {/* Show available users for general feedback */}
                        {(loanId === 'general-feedback' || !loanId) && availableUsers
                          .filter(user => user.userType === sendForm.recipientType)
                          .map(user => (
                            <option key={user._id} value={user._id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={sendForm.subject}
                      onChange={(e) => setSendForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Enter feedback subject"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={sendForm.message}
                      onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Enter your feedback message"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={sendForm.priority}
                        onChange={(e) => setSendForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reply Deadline (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={sendForm.replyDeadline}
                        onChange={(e) => setSendForm(prev => ({ ...prev, replyDeadline: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>{isLoading ? 'Sending...' : 'Send Feedback'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Feedback Tab - Chat Interface */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  💬 Admin-Borrower Chat ({feedback.length} messages)
                </h3>
                <button
                  onClick={loadFeedback}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h4 className="text-lg font-medium mb-2">No messages yet</h4>
                  <p>Start a conversation by sending feedback to a borrower or lender.</p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {feedback
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((fb) => (
                        <div
                          key={fb.id}
                          className={`flex ${fb.sender.userType === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              fb.sender.userType === 'admin'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium">
                                {fb.sender.userType === 'admin' ? '👨‍💼 Admin' : `👤 ${fb.sender.userType}`}
                              </span>
                              {fb.isReply && (
                                <span className="text-xs bg-green-500 text-white px-1 rounded">
                                  Reply
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium mb-1">{fb.subject}</p>
                            <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {new Date(fb.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('send')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Send New Message</span>
                </button>
                <button
                  onClick={loadFeedback}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Refresh Chat</span>
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Feedback Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Feedback</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{feedback.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Replied</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {feedback.filter(fb => fb.status === 'replied').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Pending</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {feedback.filter(fb => fb.status === 'sent' || fb.status === 'delivered').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reply Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reply to Feedback
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFeedback.subject}
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
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
                      Message *
                    </label>
                    <textarea
                      value={replyForm.message}
                      onChange={(e) => setReplyForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Enter your reply message"
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

export default FeedbackManagement;
