"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface FaceRegisterProps {
  onDescriptorCaptured: (descriptor: number[]) => void;
  onClose: () => void;
}

export default function FaceRegister({ onDescriptorCaptured, onClose }: FaceRegisterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info", text: string }>({ type: "info", text: "Loading models..." });
  const [faceFound, setFaceFound] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus({ type: "info", text: "Looking for face..." });
    } catch (err) {
      console.error("Model load error:", err);
      setStatus({ type: "error", text: "Failed to load models" });
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setStatus({ type: "error", text: "Camera access denied" });
    }
  }, []);

  useEffect(() => {
    loadModels();
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [loadModels, startCamera]);

  // Continuous face detection
  useEffect(() => {
    if (!modelsLoaded) return;
    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      setFaceFound(!!detection);
      if (detection) setStatus({ type: "success", text: "Face found — ready to capture" });
      else setStatus({ type: "info", text: "Looking for face..." });
    }, 500);
    return () => clearInterval(interval);
  }, [modelsLoaded]);

  const handleCapture = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setCapturing(true);
    setStatus({ type: "info", text: "Capturing..." });

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus({ type: "error", text: "No face detected. Try again." });
        setCapturing(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      setStatus({ type: "success", text: "Face captured successfully!" });
      
      // Stop camera
      streamRef.current?.getTracks().forEach((t) => t.stop());
      
      setTimeout(() => onDescriptorCaptured(descriptor), 500);
    } catch {
      setStatus({ type: "error", text: "Capture failed. Try again." });
      setCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-gray-200 shadow-lg max-w-sm w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Register Face</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none transition-colors">&times;</button>
        </div>

        <div className="p-4">
          <div className="relative w-full aspect-[4/3] bg-gray-100 rounded overflow-hidden mb-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          <div className={`px-3 py-2 rounded text-xs flex items-center justify-center gap-1.5 font-medium text-center mb-3 border ${
            status.type === "success" ? "text-green-700 bg-green-50 border-green-200" : status.type === "error" ? "text-red-700 bg-red-50 border-red-200" : "text-gray-600 bg-gray-50 border-gray-200"
          }`}>
            {status.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {status.type === "error" && <XCircle className="w-4 h-4" />}
            {status.type === "info" && status.text.includes("...") && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.text}
          </div>

          <button
            onClick={handleCapture}
            disabled={!faceFound || capturing}
            className="w-full py-3 rounded font-semibold text-sm flex items-center justify-center gap-2
                       bg-blue-600 text-white hover:bg-blue-700
                       disabled:opacity-50 transition-colors shadow-sm"
          >
            {capturing ? "Capturing..." : <><Camera className="w-5 h-5" /> Capture Face</>}
          </button>
        </div>
      </div>
    </div>
  );
}
