import * as faceapi from "face-api.js";

function speak(message) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  }
}

export async function startLivenessCheck(videoElement, onComplete, setProgress, setStatus) {
  
  let progress = 0;
  const intervalProgress = setInterval(() => {
    progress += 10;
    if (setProgress) setProgress((p) => (p < 90 ? progress : p));
  }, 200);

  // Load face-api.js models with error handling
  try {
    console.log('Loading face-api.js models...');
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    if (setStatus) setStatus("Failed to load face detection models ❌");
    if (onComplete) onComplete(false);
    return;
  }

  speak("Please blink your eyes to start the liveness check.");

  clearInterval(intervalProgress);
  if (setProgress) setProgress(100);

  
  let blinked = false;
  let mouthOpened = false;
  let headTurned = false;

  const interval = setInterval(async () => {
    try {
      const detections = await faceapi
        .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
        .withFaceLandmarks();

      if (detections) {
      const landmarks = detections.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();

    
      if (!blinked && checkBlink(leftEye, rightEye)) {
        blinked = true;
        speak("Good job! Now please open your mouth.");
        if (setStatus) setStatus("Blink detected ✅, now open your mouth...");
      }

      
      if (blinked && !mouthOpened && checkMouthOpen(mouth)) {
        mouthOpened = true;
        speak("Nice! Now please turn your head left or right.");
        if (setStatus) setStatus("Mouth open detected ✅, now turn your head...");
      }

      
      if (blinked && mouthOpened && !headTurned && checkHeadTurn(nose, landmarks)) {
        headTurned = true;
        speak("Excellent. Liveness check complete.");
        clearInterval(interval);
        clearTimeout(timeout); 
        if (setStatus) setStatus("✅ Liveness check passed!");
        setTimeout(() => {
          if (onComplete) onComplete(true);
        }, 3000);
      }
    } else {
      // No face detected
      if (setStatus) setStatus("Please position your face in the camera view...");
    }
    } catch (error) {
      console.error('Face detection error:', error);
      if (setStatus) setStatus("Face detection error. Please try again.");
    }
  }, 500);


  const timeout = setTimeout(() => {
    clearInterval(interval);
    if (setStatus) setStatus(" Liveness check failed (timeout). Please try again.");
    speak("Liveness check failed due to timeout. Please try again.");
    if (onComplete) onComplete(false);
  }, 60000); // 60 sec

  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}

function checkBlink(leftEye, rightEye) {
  const EAR = (eye) => {
    const vertical1 = distance(eye[1], eye[5]);
    const vertical2 = distance(eye[2], eye[4]);
    const horizontal = distance(eye[0], eye[3]);
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };

  const leftEAR = EAR(leftEye);
  const rightEAR = EAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2.0;
  return avgEAR < 0.25; 
}

function checkMouthOpen(mouth) {
  const topLip = mouth[13];  
  const bottomLip = mouth[19]; 
  const mouthOpening = distance(topLip, bottomLip);

  const leftCorner = mouth[0];
  const rightCorner = mouth[6];
  const mouthWidth = distance(leftCorner, rightCorner);

  const ratio = mouthOpening / mouthWidth;
  return ratio > 0.35; 
}

function checkHeadTurn(nose, landmarks) {
  
  const leftCheek = landmarks.getLeftEye()[0];
  const rightCheek = landmarks.getRightEye()[3];
  const faceWidth = distance(leftCheek, rightCheek);

  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const noseX = nose[3].x;
  const offset = noseX - faceCenterX;

  const ratio = offset / faceWidth;

  
  return Math.abs(ratio) > 0.35;
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
