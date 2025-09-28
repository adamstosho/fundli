import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  User, 
  MessageCircle,
  Paperclip,
  Download,
  FileText,
  Image,
  File,
  Phone,
  Video
} from 'lucide-react';
import VideoCall from './VideoCall';
import webrtcService from '../../services/webrtcService';
import chatSocketService from '../../services/chatSocketService';

const AdminChat = ({ 
  isOpen, 
  onClose, 
  targetUser, 
  targetUserType, // 'borrower' or 'lender'
  currentUser 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [chat, setChat] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && targetUser && (targetUser._id || targetUser.id)) {
      initializeChat();
    }
    
    // Cleanup function
    return () => {
      if (chat?.id) {
        chatSocketService.leaveChat(chat.id);
      }
    };
  }, [isOpen, targetUser]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 AdminChat initializeChat called');
      console.log('🔍 targetUser:', targetUser);
      console.log('🔍 targetUser._id:', targetUser?._id);
      console.log('🔍 targetUserType:', targetUserType);
      console.log('🔍 currentUser:', currentUser);
      
      if (!targetUser || (!targetUser._id && !targetUser.id)) {
        console.error('❌ No valid target user provided');
        alert('Error: No valid target user provided for chat');
        setIsLoading(false);
        return;
      }
      
      if (!currentUser || (!currentUser.id && !currentUser._id)) {
        console.error('❌ No valid current user provided');
        alert('Error: No valid current user provided for chat');
        setIsLoading(false);
        return;
      }
      
      // Use either _id or id field
      const targetUserId = targetUser._id || targetUser.id;
      const currentUserId = currentUser.id || currentUser._id;
      console.log('🔍 Using targetUserId:', targetUserId);
      console.log('🔍 Using currentUserId:', currentUserId);
      
      // Initialize WebRTC
      const token = localStorage.getItem('accessToken');
      webrtcService.initialize(currentUserId, token);
      
      // Initialize Chat Socket.IO
      chatSocketService.initialize(currentUserId, token);
      
      webrtcService.setCallbacks({
        onIncomingCall: (callData) => {
          setIncomingCall(callData);
        },
        onCallInitiated: (localStream) => {
          setIsInCall(true);
          setShowVideoCall(true);
        },
        onCallAnswered: (localStream) => {
          setIsInCall(true);
          setShowVideoCall(true);
        },
        onCallEnded: () => {
          setIsInCall(false);
          setShowVideoCall(false);
          setIncomingCall(null);
        },
        onRemoteStream: (remoteStream) => {
          console.log('Remote stream received:', remoteStream);
        }
      });

      // Set up chat socket callbacks (will be updated after chat is created)
      chatSocketService.setCallbacks({
        onNewMessage: (data) => {
          console.log('📨 New message received via Socket.IO:', data);
          // We'll update this callback after chat is created
        },
        onUserTyping: (data) => {
          console.log('⌨️ User typing:', data);
          // You can add typing indicator UI here if needed
        }
      });

      // Create or get admin chat
      const chatResponse = await fetch(`https://fundli-hjqn.vercel.app/api/chat/chats/admin/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserType: targetUserType
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('✅ Admin chat created successfully:', chatData);
        setChat(chatData.data.chat);
        
        // Update the Socket.IO callback now that we have the chat ID
        chatSocketService.setCallbacks({
          onNewMessage: (data) => {
            console.log('📨 New message received via Socket.IO:', data);
            if (data.chatId === chatData.data.chat.id) {
              setMessages(prev => {
                // Check if message already exists to prevent duplicates
                const messageExists = prev.some(msg => 
                  (msg._id && data.message._id && msg._id === data.message._id) ||
                  (msg.id && data.message.id && msg.id === data.message.id)
                );
                
                if (messageExists) {
                  console.log('📨 Message already exists, skipping duplicate');
                  return prev;
                }
                
                console.log('📨 Adding new message to chat');
                return [...prev, data.message];
              });
              
              // Scroll to bottom when new message arrives
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }
          },
          onUserTyping: (data) => {
            console.log('⌨️ User typing:', data);
            // You can add typing indicator UI here if needed
          }
        });
        
        loadMessages(chatData.data.chat.id);
      } else {
        const errorData = await chatResponse.json();
        console.error('❌ Failed to create admin chat:', errorData);
        alert(`Failed to initialize chat: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error initializing admin chat:', error);
      alert('Failed to initialize chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/chat/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages || []);
        markAsRead(chatId);
        
        // Join the chat room via Socket.IO for real-time updates
        chatSocketService.joinChat(chatId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async (chatId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`https://fundli-hjqn.vercel.app/api/chat/chats/${chatId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !chat) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/chat/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage.trim(), type: 'text' })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || isUploading || !chat) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WEBP');
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Remove data URL prefix to get just the base64 string
      const base64Data = base64.split(',')[1];

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fundli-hjqn.vercel.app/api/chat/chats/${chat.id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          fileType: file.type
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data.message]);
      } else {
        const errorData = await response.json();
        alert(`Failed to upload file: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVoiceCall = async () => {
    try {
      if (targetUser) {
        const targetUserId = targetUser._id || targetUser.id;
        await webrtcService.initiateCall(targetUserId, 'voice');
      }
    } catch (error) {
      console.error('Error starting voice call:', error);
      alert('Failed to start voice call. Please check your microphone permissions.');
    }
  };

  const handleVideoCall = async () => {
    try {
      if (targetUser) {
        const targetUserId = targetUser._id || targetUser.id;
        await webrtcService.initiateCall(targetUserId, 'video');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please check your camera and microphone permissions.');
    }
  };

  const handleAcceptCall = async () => {
    try {
      if (incomingCall) {
        await webrtcService.answerCall(incomingCall.offer, incomingCall.callType);
        setIncomingCall(null);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to accept call. Please check your camera and microphone permissions.');
    }
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
    webrtcService.endCall();
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    setShowVideoCall(false);
    setIsInCall(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;
  
  // Additional guard to ensure we have a valid target user
  if (!targetUser || (!targetUser._id && !targetUser.id)) {
    console.error('❌ AdminChat rendered without valid target user:', targetUser);
    return null;
  }

  return (
    <>
      <AnimatePresence mode="wait" key="admin-chat">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-secondary-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900 dark:text-white">
                    Admin Chat with {targetUser?.firstName} {targetUser?.lastName}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {targetUserType === 'borrower' ? 'Borrower' : 'Lender'} • Direct Communication
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleVoiceCall}
                  disabled={isInCall}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-secondary-700 disabled:bg-neutral-200 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Voice call"
                >
                  <Phone className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </button>
                <button 
                  onClick={handleVideoCall}
                  disabled={isInCall}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-secondary-700 disabled:bg-neutral-200 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Video call"
                >
                  <Video className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  // Simple and reliable message alignment logic
                  const senderId = message.sender._id || message.sender.id;
                  const userId = currentUser.id || currentUser._id;
                  
                  // Convert both to strings for reliable comparison
                  const senderIdStr = senderId?.toString();
                  const userIdStr = userId?.toString();
                  
                  // Check if the sender is the current user
                  let isOwn = senderIdStr === userIdStr;
                  
                  // Fallback: if IDs don't match, check by name
                  if (!isOwn && message.sender?.firstName === currentUser?.firstName) {
                    isOwn = true;
                  }
                  
                  // Additional fallback: check by email if available
                  if (!isOwn && message.sender?.email === currentUser?.email) {
                    isOwn = true;
                  }
                  
                  // FORCE ALTERNATING ALIGNMENT FOR TESTING - This will make messages alternate sides
                  isOwn = index % 2 === 0; // Even indices = own (right), odd indices = received (left)
                  
                  // Create a unique key using multiple fallbacks to ensure uniqueness
                  const messageKey = `msg-${message._id || message.id || 'unknown'}-${index}-${message.createdAt || index}-${message.sender?._id || message.sender?.id || 'unknown'}`;
                  
                  return (
                    <motion.div
                      key={messageKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${
                        isOwn 
                          ? 'bg-primary-600 text-white border border-primary-500' 
                          : 'bg-neutral-100 dark:bg-secondary-700 text-secondary-900 dark:text-white border border-neutral-200 dark:border-neutral-600'
                      }`}>
                        {/* Sender name for received messages */}
                        {!isOwn && (
                          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            {message.sender.firstName} {message.sender.lastName}
                          </p>
                        )}
                        
                        {/* Visual indicator for testing */}
                        <div className="text-xs font-bold mb-1">
                          {isOwn ? '🔵 RIGHT SIDE (OWN)' : '🔴 LEFT SIDE (RECEIVED)'} - Message {index + 1}
                        </div>
                        
                        <p className="text-sm">{message.content}</p>
                        
                        {/* File Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, attIndex) => (
                              <div key={`${messageKey}-attachment-${attIndex}`} className={`p-2 rounded border ${
                                isOwn 
                                  ? 'bg-primary-500 border-primary-400' 
                                  : 'bg-white dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <div className={`${
                                    isOwn ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                                  }`}>
                                    {getFileIcon(attachment.mimeType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${
                                      isOwn ? 'text-white' : 'text-neutral-900 dark:text-white'
                                    }`}>
                                      {attachment.originalName}
                                    </p>
                                    <p className={`text-xs ${
                                      isOwn ? 'text-primary-100' : 'text-neutral-500 dark:text-neutral-400'
                                    }`}>
                                      {formatFileSize(attachment.size)}
                                    </p>
                                  </div>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-1 rounded hover:bg-opacity-80 ${
                                      isOwn ? 'hover:bg-primary-400' : 'hover:bg-neutral-200 dark:hover:bg-neutral-500'
                                    }`}
                                    title="Download file"
                                  >
                                    <Download className={`h-3 w-3 ${
                                      isOwn ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                                    }`} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-100' : 'text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-neutral-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 rounded-b-lg">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
              />
              
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white resize-none"
                    rows="1"
                    disabled={isSending || isUploading}
                  />
                </div>
                
                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSending}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:bg-neutral-400 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-400 rounded-lg transition-colors"
                  title="Attach file"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>
                
                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending || isUploading}
                  className="p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
    
    {/* Video Call Modal - Outside main AnimatePresence to avoid key conflicts */}
    <VideoCall
      key="admin-video-call"
      isOpen={showVideoCall || !!incomingCall}
      onClose={handleEndCall}
      isIncoming={!!incomingCall}
      callerInfo={incomingCall?.fromUserInfo || targetUser}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
      callType={incomingCall?.callType || 'video'}
    />
    </>
  );
};

export default AdminChat;
