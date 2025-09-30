const jwt = require('jsonwebtoken');

class WebRTCSignalingService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // Setup authentication middleware
  setupMiddleware() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userInfo = {
          id: decoded.id,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          email: decoded.email,
          userType: decoded.userType
        };

        next();
      } catch (error) {
        console.error('WebRTC authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 WebRTC user connected: ${socket.userInfo.firstName} ${socket.userInfo.lastName} (${socket.userId})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);

      // Handle call offer
      socket.on('call-offer', (data) => {
        console.log(`📞 Call offer from ${socket.userId} to ${data.targetUserId}`);
        this.handleCallOffer(socket, data);
      });

      // Handle call answer
      socket.on('call-answer', (data) => {
        console.log(`✅ Call answer from ${socket.userId}`);
        this.handleCallAnswer(socket, data);
      });

      // Handle ICE candidate
      socket.on('ice-candidate', (data) => {
        console.log(`🧊 ICE candidate from ${socket.userId}`);
        this.handleIceCandidate(socket, data);
      });

      // Handle call ended
      socket.on('call-ended', () => {
        console.log(`📴 Call ended by ${socket.userId}`);
        this.handleCallEnded(socket);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 WebRTC user disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  // Handle incoming call offer
  handleCallOffer(senderSocket, data) {
    const { targetUserId, offer, callType } = data;
    
    const targetSocket = this.getSocketByUserId(targetUserId);
    if (!targetSocket) {
      console.log(`❌ Target user ${targetUserId} not connected`);
      senderSocket.emit('call-error', {
        message: 'User is not available for calls'
      });
      return;
    }

    // Send call offer to target user
    targetSocket.emit('call-offer', {
      fromUserId: senderSocket.userId,
      fromUserInfo: senderSocket.userInfo,
      offer: offer,
      callType: callType
    });

    console.log(`📞 Call offer sent to ${targetUserId}`);
  }

  // Handle call answer
  handleCallAnswer(answererSocket, data) {
    const { answer } = data;
    
    // Find the original caller (this is a simplified approach)
    // In a production app, you'd want to track call sessions
    this.io.emit('call-answer', {
      fromUserId: answererSocket.userId,
      answer: answer
    });

    console.log(`✅ Call answer broadcasted from ${answererSocket.userId}`);
  }

  // Handle ICE candidate exchange
  handleIceCandidate(senderSocket, data) {
    const { targetUserId, candidate } = data;
    
    if (targetUserId) {
      // Send to specific user
      const targetSocket = this.getSocketByUserId(targetUserId);
      if (targetSocket) {
        targetSocket.emit('ice-candidate', {
          fromUserId: senderSocket.userId,
          candidate: candidate
        });
      }
    } else {
      // Broadcast to all (for call answer scenario)
      senderSocket.broadcast.emit('ice-candidate', {
        fromUserId: senderSocket.userId,
        candidate: candidate
      });
    }

    console.log(`🧊 ICE candidate forwarded from ${senderSocket.userId}`);
  }

  // Handle call ended
  handleCallEnded(socket) {
    // Notify all connected users that the call ended
    socket.broadcast.emit('call-ended', {
      fromUserId: socket.userId
    });

    console.log(`📴 Call ended notification sent from ${socket.userId}`);
  }

  // Get socket by user ID
  getSocketByUserId(userId) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      return this.io.sockets.sockets.get(socketId);
    }
    return null;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send notification to specific user
  sendNotificationToUser(userId, event, data) {
    const socket = this.getSocketByUserId(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }
}

module.exports = WebRTCSignalingService;








