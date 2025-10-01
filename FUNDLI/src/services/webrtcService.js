import { io } from 'socket.io-client';

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callbacks = {};
    
    // WebRTC configuration
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
  }

  // Initialize the service
  initialize(userId, token) {
    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      query: {
        userId: userId
      }
    });

    this.setupSocketListeners();
  }

  // Setup socket event listeners
  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('WebRTC service connected');
    });

    this.socket.on('call-offer', async (data) => {
      if (this.callbacks.onIncomingCall) {
        this.callbacks.onIncomingCall(data);
      }
    });

    this.socket.on('call-answer', async (data) => {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(data.answer);
      }
    });

    this.socket.on('ice-candidate', async (data) => {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(data.candidate);
      }
    });

    this.socket.on('call-ended', () => {
      this.cleanup();
      if (this.callbacks.onCallEnded) {
        this.callbacks.onCallEnded();
      }
    });
  }

  // Set event callbacks
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Initiate a call
  async initiateCall(targetUserId, callType = 'video') {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', {
            targetUserId: targetUserId,
            candidate: event.candidate
          });
        }
      };

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('call-offer', {
        targetUserId: targetUserId,
        offer: offer,
        callType: callType
      });

      if (this.callbacks.onCallInitiated) {
        this.callbacks.onCallInitiated(this.localStream);
      }

      return this.localStream;

    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  // Answer a call
  async answerCall(offer, callType = 'video') {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', {
            candidate: event.candidate
          });
        }
      };

      // Set remote description
      await this.peerConnection.setRemoteDescription(offer);

      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socket.emit('call-answer', {
        answer: answer
      });

      if (this.callbacks.onCallAnswered) {
        this.callbacks.onCallAnswered(this.localStream);
      }

      return this.localStream;

    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  // End the call
  endCall() {
    this.socket.emit('call-ended');
    this.cleanup();
  }

  // Toggle mute
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  // Cleanup resources
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  // Disconnect
  disconnect() {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const webrtcService = new WebRTCService();

export default webrtcService;










