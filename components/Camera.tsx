"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

interface CameraProps {
  onFaceDetected: (detected: boolean) => void;
}

/**
 * Camera component — opens device camera and runs face detection
 * using face-api.js TinyFaceDetector model.
 */
export default function Camera({ onFaceDetected }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<string>("Initializing...");
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadModels = useCallback(async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      setModelsLoaded(true);
      setFaceStatus("Looking for face...");
    } catch (error) {
      console.error("Error loading face-api models:", error);
      setFaceStatus("Failed to load models");
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Could not access camera. Please grant permission.");
    }
  }, []);

  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelsLoaded) return;
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      );
      const detected = detections.length > 0;
      onFaceDetected(detected);
      setFaceStatus(detected ? "✅ Face detected" : "❌ No face detected");
    }, 500);
  }, [modelsLoaded, onFaceDetected]);

  useEffect(() => {
    loadModels();
    startCamera();
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [loadModels, startCamera]);

  useEffect(() => {
    if (modelsLoaded) startDetection();
    return () => { if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current); };
  }, [modelsLoaded, startDetection]);

  const statusColor = faceStatus.includes("✅")
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : faceStatus.includes("❌")
    ? "text-red-500 bg-red-50 border-red-200"
    : "text-slate-500 bg-slate-50 border-slate-200";

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      {/* Camera preview */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-red-500">
            <p className="text-sm">{cameraError}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}
      </div>

      {/* Face detection status badge */}
      <div className={`px-4 py-2 rounded-full text-xs font-medium border ${statusColor} transition-all`}>
        {faceStatus}
      </div>
    </div>
  );
}
