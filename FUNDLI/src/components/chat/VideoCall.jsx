import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  X,
  PhoneOff,
  Volume2,
  VolumeX
} from 'lucide-react';

const VideoCall = ({ 
  isOpen, 
  onClose, 
  isIncoming = false, 
  callerInfo = null,
  onAccept,
  onReject,
  callType = 'video' // 'video' or 'voice'
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (isOpen && !isIncoming) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, isIncoming]);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };
      
      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer via signaling
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      sendSignalingMessage({
        type: 'offer',
        offer: offer
      });
      
      setIsConnecting(false);
      setIsConnected(true);
      startCallTimer();
      
    } catch (error) {
      console.error('Error initializing call:', error);
      setIsConnecting(false);
      alert('Failed to start call. Please check your camera and microphone permissions.');
    }
  };

  const handleAcceptCall = async () => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(rtcConfiguration);
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };
      
      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle incoming offer (this would come from signaling server)
      // For demo purposes, we'll simulate accepting the call
      setIsConnecting(false);
      setIsConnected(true);
      startCallTimer();
      
      if (onAccept) {
        onAccept();
      }
      
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsConnecting(false);
      alert('Failed to accept call. Please check your camera and microphone permissions.');
    }
  };

  const handleRejectCall = () => {
    cleanup();
    if (onReject) {
      onReject();
    }
  };

  const handleEndCall = () => {
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsSpeakerOff(remoteVideoRef.current.muted);
    }
  };

  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(duration);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setCallDuration(0);
  };

  const sendSignalingMessage = (message) => {
    // This would send the message via WebSocket or HTTP to the signaling server
    // For demo purposes, we'll just log it
    console.log('Signaling message:', message);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" key="video-call">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-secondary-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                  {callType === 'video' ? (
                    <Video className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900 dark:text-white">
                    {isIncoming ? 'Incoming Call' : 'Calling...'}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {callerInfo ? `${callerInfo.firstName} ${callerInfo.lastName}` : 'Unknown User'}
                  </p>
                </div>
              </div>
              
              {isConnected && (
                <div className="text-center">
                  <div className="text-lg font-mono text-secondary-900 dark:text-white">
                    {formatDuration(callDuration)}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Call Duration
                  </div>
                </div>
              )}
              
              <button
                onClick={handleEndCall}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-neutral-900">
              {callType === 'video' ? (
                <>
                  {/* Remote Video */}
                  <div className="absolute inset-0">
                    {remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="h-8 w-8 text-neutral-400" />
                          </div>
                          <p className="text-neutral-400">
                            {isConnecting ? 'Connecting...' : 'Waiting for video...'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Local Video */}
                  {localStream && (
                    <div className="absolute top-4 right-4 w-32 h-24 bg-neutral-800 rounded-lg overflow-hidden border-2 border-white">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Voice Call UI */
                <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Phone className="h-16 w-16" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">
                      {callerInfo ? `${callerInfo.firstName} ${callerInfo.lastName}` : 'Voice Call'}
                    </h3>
                    <p className="text-primary-100">
                      {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Calling...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-white dark:bg-secondary-800">
              {isIncoming && !isConnected ? (
                /* Incoming Call Controls */
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={handleRejectCall}
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <PhoneOff className="h-8 w-8 text-white" />
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Phone className="h-8 w-8 text-white" />
                  </button>
                </div>
              ) : (
                /* Active Call Controls */
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isMuted 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-neutral-600 hover:bg-neutral-700'
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="h-6 w-6 text-white" />
                    ) : (
                      <Mic className="h-6 w-6 text-white" />
                    )}
                  </button>

                  {callType === 'video' && (
                    <button
                      onClick={toggleVideo}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isVideoOff 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-neutral-600 hover:bg-neutral-700'
                      }`}
                    >
                      {isVideoOff ? (
                        <VideoOff className="h-6 w-6 text-white" />
                      ) : (
                        <Video className="h-6 w-6 text-white" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={toggleSpeaker}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isSpeakerOff 
                        ? 'bg-neutral-600 hover:bg-neutral-700' 
                        : 'bg-neutral-600 hover:bg-neutral-700'
                    }`}
                  >
                    {isSpeakerOff ? (
                      <VolumeX className="h-6 w-6 text-white" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-white" />
                    )}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <PhoneOff className="h-6 w-6 text-white" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoCall;
