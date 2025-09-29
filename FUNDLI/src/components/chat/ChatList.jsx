import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Clock, 
  User, 
  DollarSign,
  ChevronRight,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

const ChatList = ({ onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl('/chat/chats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.data.chats || []);
      } else {
        setError('Failed to load chats');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (participants, currentUserId) => {
    if (!participants || !Array.isArray(participants)) return null;
    return participants.find(p => p._id !== currentUserId) || participants[0];
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat.participants, 'currentUserId');
    if (!otherParticipant) return false;
    
    // Include admin chats, loan chats, and pool chats
    const hasValidContext = chat.loan || chat.pool || chat.chatType === 'admin_support';
    if (!hasValidContext) return false;
    
    const matchesSearch = otherParticipant.firstName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         otherParticipant.lastName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         (chat.loan?.purpose?.toLowerCase().includes(searchFilter.toLowerCase())) ||
                         (chat.pool?.name?.toLowerCase().includes(searchFilter.toLowerCase())) ||
                         (chat.chatType === 'admin_support' && 'admin support'.includes(searchFilter.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unread' && chat.unreadCount > 0) ||
                         (statusFilter === 'active' && (chat.loan?.status === 'approved' || chat.pool || chat.chatType === 'admin_support'));
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-error">{error}</p>
        <button 
          onClick={loadChats}
          className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-secondary-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
            Messages
          </h2>
          <button
            onClick={loadChats}
            disabled={isLoading}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
            title="Refresh chats"
          >
            <RefreshCw className={`h-4 w-4 text-neutral-600 dark:text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('unread')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'unread' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'active' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              Active Loans
            </button>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">
              {searchFilter ? 'No conversations found' : 'No messages yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat, index) => {
              const otherParticipant = getOtherParticipant(chat.participants, 'currentUserId');
              const isSelected = selectedChatId === chat._id;
              
              if (!otherParticipant || (!chat.loan && !chat.pool && chat.chatType !== 'admin_support')) return null;
              
              return (
                <motion.div
                  key={chat._id || `chat-${index}`}
                  onClick={() => onSelectChat(chat)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-600' 
                      : 'hover:bg-neutral-50 dark:hover:bg-secondary-700'
                  }`}
                  whileHover={{ backgroundColor: isSelected ? undefined : 'rgba(0,0,0,0.05)' }}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-secondary-900 dark:text-white truncate">
                          {otherParticipant.firstName} {otherParticipant.lastName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {chat.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {chat.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {formatTime(chat.lastMessage?.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        {chat.chatType === 'admin_support' ? (
                          <>
                            <MessageCircle className="h-4 w-4 text-primary-600" />
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              Admin Support Chat
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                              Admin Chat
                            </span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 text-success" />
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {chat.loan ? 
                                `₦${chat.loan.loanAmount.toLocaleString()} - ${chat.loan.purpose}` :
                                chat.pool ? 
                                `${chat.pool.currency} ${chat.pool.poolSize?.toLocaleString()} - ${chat.pool.name}` :
                                'Loading details...'
                              }
                            </span>
                            {chat.loan && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                chat.loan.status === 'approved' 
                                  ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                                  : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
                              }`}>
                                {chat.loan.status}
                              </span>
                            )}
                            {chat.pool && (
                              <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                                Pool Chat
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      {chat.lastMessage && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
