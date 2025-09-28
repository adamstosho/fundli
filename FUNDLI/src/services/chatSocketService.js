import { io } from 'socket.io-client';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.callbacks = {};
    this.currentUserId = null;
    this.currentToken = null;
  }

  // Initialize Socket.IO connection
  initialize(userId, token) {
    try {
      this.currentUserId = userId;
      this.currentToken = token;

      // Disconnect existing connection if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new Socket.IO connection
      this.socket = io('http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Set up event listeners
      this.setupEventListeners();

      console.log('✅ Chat Socket.IO initialized for user:', userId);
    } catch (error) {
      console.error('❌ Chat Socket.IO initialization error:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Chat Socket.IO connected:', this.socket.id);
      this.isConnected = true;
      
      // Join user to their personal room
      this.socket.emit('join', { token: this.currentToken });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Chat Socket.IO disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Chat Socket.IO connection error:', error);
      this.isConnected = false;
    });

    // Authentication events
    this.socket.on('joined', (data) => {
      console.log('✅ Joined chat room:', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Chat Socket.IO error:', error);
    });

    // Chat room events
    this.socket.on('chat_joined', (data) => {
      console.log('✅ Joined chat room:', data.chatId);
    });

    // Message events
    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      console.log('📨 Current callbacks:', this.callbacks);
      
      // Call the new message callback if set
      if (this.callbacks.onNewMessage) {
        console.log('📨 Calling onNewMessage callback');
        this.callbacks.onNewMessage(data);
      } else {
        console.log('📨 No onNewMessage callback set');
      }
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      
      // Call the typing callback if set
      if (this.callbacks.onUserTyping) {
        this.callbacks.onUserTyping(data);
      }
    });

    // Debug events
    this.socket.on('debug_message', (data) => {
      console.log('🔍 Debug message received:', data);
    });
  }

  // Join a specific chat room
  joinChat(chatId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot join chat');
      return;
    }

    this.socket.emit('join_chat', { chatId: chatId });
    console.log('💬 Joining chat room:', chatId);
  }

  // Leave a specific chat room
  leaveChat(chatId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot leave chat');
      return;
    }

    this.socket.emit('leave_chat', { chatId: chatId });
    console.log('👋 Leaving chat room:', chatId);
  }

  // Send a message (this is mainly for testing, actual messages are sent via API)
  sendMessage(chatId, message) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected, cannot send message');
      return;
    }

    this.socket.emit('send_message', { 
      chatId: chatId, 
      message: message 
    });
    console.log('📤 Message sent via socket:', message);
  }

  // Send typing start indicator
  sendTypingStart(chatId) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing_start', { chatId: chatId });
  }

  // Send typing stop indicator
  sendTypingStop(chatId) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing_stop', { chatId: chatId });
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Chat Socket.IO disconnected');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

// Create and export a singleton instance
const chatSocketService = new ChatSocketService();
export default chatSocketService;
