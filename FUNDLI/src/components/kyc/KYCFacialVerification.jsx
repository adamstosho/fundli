import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  User,
  FileText,
  Eye,
  Smile,
  RotateCcw
} from 'lucide-react';
import { buildApiUrl } from '../../utils/config';
import * as faceapi from 'face-api.js';

const KYCFacialVerification = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Document upload state
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentType, setDocumentType] = useState('national_id');
  const [documentNumber, setDocumentNumber] = useState('');
  
  // Camera capture state
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessInstructions, setLivenessInstructions] = useState([
    'Look directly at the camera',
    'Blink your eyes',
    'Smile naturally',
    'Turn your head slightly left',
    'Turn your head slightly right'
  ]);
  
  // Verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationScore, setVerificationScore] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Face-API.js models (will be loaded)
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadFaceAPIModels();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadFaceAPIModels = async () => {
    try {
      // Load Face-API.js models from CDN (fallback to local if CDN fails)
      const modelUrls = [
        'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
        '/models'
      ];
      
      let modelsLoaded = false;
      
      for (const baseUrl of modelUrls) {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
            faceapi.nets.faceExpressionNet.loadFromUri(baseUrl)
          ]);
          modelsLoaded = true;
          break;
        } catch (error) {
          console.warn(`Failed to load models from ${baseUrl}:`, error);
          continue;
        }
      }
      
      if (modelsLoaded) {
        setModelsLoaded(true);
      } else {
        throw new Error('Failed to load models from all sources');
      }
    } catch (error) {
      console.error('Error loading Face-API models:', error);
      setError('Failed to load face detection models. Please refresh the page.');
    }
  };

  const handleDocumentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDocumentFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setDocumentPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('canplay', onCanPlay);
            setIsVideoReady(true);
            resolve();
          };
          
          const onCanPlay = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('canplay', onCanPlay);
            setIsVideoReady(true);
            resolve();
          };
          
          const onError = (error) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('canplay', onCanPlay);
            reject(error);
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('canplay', onCanPlay);
            reject(new Error('Video loading timeout'));
          }, 5000);
        });
      }
      
      setCurrentStep(2);
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setError('');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Wait for video to be ready with retry mechanism
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
          break;
        }
        
        // Wait 100ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Final check
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
        throw new Error('Video not ready for capture. Please wait a moment and try again.');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob with proper error handling
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.8);
      });
      
      // Validate blob before creating object URL
      if (!blob || blob.size === 0) {
        throw new Error('Invalid blob created from canvas');
      }
      
      // Create object URL with fallback
      let imageUrl;
      try {
        imageUrl = URL.createObjectURL(blob);
      } catch (urlError) {
        console.warn('createObjectURL failed, using canvas data URL:', urlError);
        // Fallback to canvas data URL
        imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      }
      
      setCapturedImage(imageUrl);
      
      // Perform liveness check
      await performLivenessCheck(blob);
      
    } catch (error) {
      console.error('Capture error:', error);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const performLivenessCheck = async (imageBlob) => {
    if (!modelsLoaded) {
      setError('Face detection models not loaded. Please refresh the page.');
      return;
    }

    try {
      // Create image element from blob
      const img = new Image();
      img.src = URL.createObjectURL(imageBlob);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Detect faces and landmarks
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) {
        setError('No face detected. Please ensure your face is clearly visible.');
        return;
      }

      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only your face is visible.');
        return;
      }

      const detection = detections[0];
      const expressions = detection.expressions;
      
      // Check for natural expressions (liveness indicators)
      const hasNaturalExpression = expressions.happy > 0.3 || expressions.neutral > 0.5;
      const hasEyeOpenness = detection.landmarks.getLeftEye().length > 0 && 
                            detection.landmarks.getRightEye().length > 0;

      if (hasNaturalExpression && hasEyeOpenness) {
        setLivenessStep(prev => prev + 1);
        if (livenessStep >= livenessInstructions.length - 1) {
          setCurrentStep(3);
        } else {
          setLivenessStep(prev => prev + 1);
        }
      } else {
        setError('Please ensure you are looking directly at the camera with a natural expression.');
      }

    } catch (error) {
      console.error('Liveness check error:', error);
      setError('Liveness check failed. Please try again.');
    }
  };

  const uploadDocument = async () => {
    if (!documentFile || !documentNumber) {
      setError('Please upload a document and enter the document number.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl('/kyc/upload-document'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Document uploaded successfully!');
        setTimeout(() => {
          setSuccess('');
          startCamera();
        }, 1500);
      } else {
        setError(data.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLiveFace = async () => {
    if (!capturedImage) {
      setError('Please capture a photo first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let blob;
      
      // Handle both object URL and data URL formats
      if (capturedImage.startsWith('blob:')) {
        // Object URL - convert to blob
        const response = await fetch(capturedImage);
        blob = await response.blob();
      } else if (capturedImage.startsWith('data:')) {
        // Data URL - convert to blob
        const response = await fetch(capturedImage);
        blob = await response.blob();
      } else {
        throw new Error('Invalid image format');
      }

      const formData = new FormData();
      formData.append('liveFace', blob, 'live-face.jpg');

      const token = localStorage.getItem('accessToken');
      const uploadResponse = await fetch(buildApiUrl('/kyc/capture-face'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (uploadResponse.ok) {
        // Now perform face verification
        await performFaceVerification();
      } else {
        setError(uploadData.message || 'Failed to upload live face');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload live face. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const performFaceVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl('/kyc/verify-faces'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationResult(data.data);
        setVerificationScore(data.data.verificationScore);
        setCurrentStep(4);
        
        if (data.data.kycVerified) {
          setSuccess('KYC verification successful!');
          setTimeout(() => {
            onComplete && onComplete(data.data);
          }, 2000);
        }
      } else {
        setError(data.message || 'Face verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Face verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retryVerification = () => {
    setCurrentStep(1);
    setDocumentFile(null);
    setDocumentPreview(null);
    setCapturedImage(null);
    setVerificationResult(null);
    setVerificationScore(null);
    setLivenessStep(0);
    setError('');
    setSuccess('');
    setIsVideoReady(false);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoReady(false);
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Upload Identity Document
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please upload a clear photo of your government-issued ID
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-white"
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="driver_license">Driver's License</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Document Number
          </label>
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Enter document number"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Upload Document
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
          >
            {documentPreview ? (
              <div className="space-y-2">
                <img
                  src={documentPreview}
                  alt="Document preview"
                  className="w-32 h-20 object-cover rounded mx-auto"
                />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {documentFile?.name}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-neutral-400 mx-auto" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  PNG, JPG, WebP up to 10MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleDocumentUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={uploadDocument}
          disabled={isLoading || !documentFile || !documentNumber}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Upload Document
        </button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Capture Live Photo
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {livenessInstructions[livenessStep]}
        </p>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 bg-neutral-900 rounded-lg object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {capturedImage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p>Photo captured successfully!</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={stopCamera}
          className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={capturePhoto}
          disabled={isCapturing || !stream || !isVideoReady}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isCapturing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {!isVideoReady ? 'Preparing Camera...' : 'Capture Photo'}
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Verifying Your Identity
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Comparing your document photo with your live capture
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <img
              src={documentPreview}
              alt="Document"
              className="w-24 h-16 object-cover rounded mx-auto mb-2"
            />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Document Photo</p>
          </div>
          <div className="text-center">
            <img
              src={capturedImage}
              alt="Live capture"
              className="w-24 h-16 object-cover rounded mx-auto mb-2"
            />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Live Capture</p>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <RefreshCw className="h-4 w-4 animate-spin text-primary-600" />
            <span className="text-primary-600 dark:text-primary-400">Processing...</span>
          </div>
        </div>
      </div>

      <button
        onClick={uploadLiveFace}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Verify Identity
      </button>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        {verificationResult?.kycVerified ? (
          <div className="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-error-600" />
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          {verificationResult?.kycVerified ? 'Verification Successful!' : 'Verification Failed'}
        </h2>
        
        <p className="text-neutral-600 dark:text-neutral-400">
          {verificationResult?.kycVerified 
            ? 'Your identity has been successfully verified'
            : 'Face comparison did not meet the required threshold'
          }
        </p>
      </div>

      {verificationResult && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">Similarity Score:</span>
            <span className={`font-semibold ${
              verificationResult.verificationScore >= 85 
                ? 'text-success-600' 
                : 'text-error-600'
            }`}>
              {verificationResult.verificationScore}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">Liveness Check:</span>
            <span className={`font-semibold ${
              verificationResult.livenessCheckPassed 
                ? 'text-success-600' 
                : 'text-error-600'
            }`}>
              {verificationResult.livenessCheckPassed ? 'Passed' : 'Failed'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">Verification Date:</span>
            <span className="text-neutral-900 dark:text-white">
              {new Date(verificationResult.verificationDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        {!verificationResult?.kycVerified && (
          <button
            onClick={retryVerification}
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
        
        <button
          onClick={() => onComplete && onComplete(verificationResult)}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {verificationResult?.kycVerified ? 'Continue' : 'Close'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Upload Document</span>
          <span>Capture Photo</span>
          <span>Verify Identity</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center"
          >
            <AlertTriangle className="h-5 w-5 text-error-600 mr-2" />
            <span className="text-error-700 dark:text-error-300">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg flex items-center"
          >
            <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
            <span className="text-success-700 dark:text-success-300">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default KYCFacialVerification;
