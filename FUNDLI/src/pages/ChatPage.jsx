import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, DollarSign, Clock } from 'lucide-react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fundli-hjqn.vercel.app/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Current user loaded:', data.data.user);
        console.log('🔍 User ID:', data.data.user.id || data.data.user._id);
        setCurrentUser(data.data.user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat) => {
    if (chat && chat.participants && (chat.loan || chat.pool || chat.chatType === 'admin_support')) {
      setSelectedChat(chat);
    } else {
      console.error('Invalid chat object:', chat);
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Messages
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Communicate with borrowers and lenders about loan applications
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-neutral-200 dark:border-secondary-700 h-[600px] overflow-hidden">
          <div className="flex h-full">
            {/* Chat List Sidebar */}
            <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-1/3 border-r border-neutral-200 dark:border-secondary-700`}>
              <ChatList 
                onSelectChat={handleSelectChat} 
                selectedChatId={selectedChat?._id}
              />
            </div>

            {/* Chat Window */}
            <div className={`${selectedChat ? 'block' : 'hidden lg:block'} w-full lg:w-2/3`}>
              <ChatWindow 
                chat={selectedChat} 
                onBack={handleBackToList}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-secondary-700"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">
                Start a Conversation
              </h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Begin discussing loan terms with potential borrowers or lenders
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-secondary-700"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">
                Loan Discussions
              </h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Discuss loan terms, repayment schedules, and funding details
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-secondary-700"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/20 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">
                Build Relationships
              </h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Establish trust and long-term partnerships in the lending community
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
