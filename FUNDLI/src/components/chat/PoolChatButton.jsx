import React, { useState } from 'react';
import { buildApiUrl } from '../../utils/config';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const PoolChatButton = ({ pool, currentUser, onStartChat }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Create or get chat for the lending pool
      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl(`/chat/chats/pool/${pool.id}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        onStartChat(data.data.chat, data.data.pool);
      } else {
        console.error('Failed to start chat:', response.statusText);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleStartChat}
      disabled={isLoading}
      className="flex items-center justify-center p-2 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Chat with lender"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
    </motion.button>
  );
};

export default PoolChatButton;
