# Face-API.js Models

This directory should contain the Face-API.js model files for face detection and recognition.

## Required Models

Download the following model files from the Face-API.js repository:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_recognition_model-shard2**
8. **face_expression_model-weights_manifest.json**
9. **face_expression_model-shard1**

## Download Instructions

1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download the model files listed above
3. Place them in this directory (`public/models/`)

## Alternative: Use CDN

If you prefer not to host the models locally, you can modify the model loading in `KYCFacialVerification.jsx` to use CDN URLs:

```javascript
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json'),
  faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_landmark_68_model-weights_manifest.json'),
  faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_recognition_model-weights_manifest.json'),
  faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_expression_model-weights_manifest.json')
]);
```

## Model Sizes

- Total size: ~15MB
- These models are required for face detection, landmark detection, face recognition, and expression analysis
