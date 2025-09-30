// components/LivenessCheck.jsx
import React, { useRef, useEffect, useState } from "react";
import { startLivenessCheck } from "./liveness";

export default function LivenessCheck({ onSuccess }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cleanup = null;
    
    async function initCamera() {
      try {
        setStatus("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        videoRef.current.onloadedmetadata = async () => {
          try {
            setStatus("Starting video...");
            await videoRef.current.play();
            setStatus("Initializing face detection...");

            cleanup = startLivenessCheck(videoRef.current, (success) => {
              if (success) {
                setStatus("✅ Liveness check completed successfully!");
                if (onSuccess) onSuccess();
              } else {
                setStatus("❌ Liveness check failed. Please try again.");
              }
              
              // Stop camera
              if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
              }
            }, setProgress, setStatus);

          } catch (err) {
            console.error("Play interrupted:", err);
            setStatus("Unable to start video ❌");
          }
        };
      } catch (err) {
        console.error("Camera access denied:", err);
        setStatus("Camera access denied ❌");
      }
    }

    initCamera();
    
    // Cleanup function
    return () => {
      if (cleanup) cleanup();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Facial Verification
        </h2>
        
        <div className="flex flex-col items-center">
          <div
            className="relative border-4 rounded-full overflow-hidden mb-4"
            style={{
              borderColor: progress < 100 ? "#f59e0b" : status.includes("✅") ? "#10b981" : "#06b6d4",
            }}
          >
            <video
              ref={videoRef}
              height="200"
              width="200"
              className="rounded-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {progress < 100 && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-lg rounded-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  Loading... {progress}%
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">{status}</p>
            {progress === 100 && !status.includes("✅") && !status.includes("❌") && (
              <div className="text-xs text-gray-500">
                <p>Follow the instructions:</p>
                <p>1. Blink your eyes</p>
                <p>2. Open your mouth</p>
                <p>3. Turn your head left or right</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
