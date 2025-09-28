import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, User, DollarSign } from 'lucide-react';

const ChatButton = ({ loan, currentUser, onStartChat }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Get chat participants for this loan
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/chat/loans/${loan.id}/chat-participants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create or get chat
        const chatResponse = await fetch(`https://fundli-hjqn.vercel.app/api/chat/chats/loan/${loan.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          onStartChat(chatData.data.chat);
        }
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherParticipant = () => {
    if (currentUser.userType === 'borrower') {
      // If current user is borrower, show lender info
      return {
        name: 'Available Lenders',
        type: 'lender'
      };
    } else {
      // If current user is lender, show borrower info
      return {
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        type: 'borrower'
      };
    }
  };

  const otherParticipant = getOtherParticipant();

  return (
    <motion.button
      onClick={handleStartChat}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {isLoading ? 'Starting Chat...' : 'Start Chat'}
      </span>
    </motion.button>
  );
};

export default ChatButton;
