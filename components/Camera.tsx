"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface RegisteredFace {
  userId: string;
  name: string;
  descriptor: Float32Array;
}

interface CameraProps {
  onFaceDetected: (detected: boolean) => void;
  onFaceRecognized?: (userId: string, name: string, distance: number) => void;
  registeredFaces?: RegisteredFace[];
}

export default function Camera({ onFaceDetected, onFaceRecognized, registeredFaces = [] }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<{ type: "success" | "warning" | "error" | "info", text: string }>({ type: "info", text: "Initializing..." });
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceMatcherRef = useRef<faceapi.FaceMatcher | null>(null);

  // Build FaceMatcher when registeredFaces change
  useEffect(() => {
    if (registeredFaces.length > 0) {
      const labeledDescriptors = registeredFaces.map(
        (f) => new faceapi.LabeledFaceDescriptors(`${f.userId}|${f.name}`, [f.descriptor])
      );
      faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    } else {
      faceMatcherRef.current = null;
    }
  }, [registeredFaces]);

  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setFaceStatus({ type: "info", text: "Looking for face..." });
    } catch (error) {
      console.error("Error loading face-api models:", error);
      setFaceStatus({ type: "error", text: "Failed to load models" });
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Could not access camera. Please grant permission.");
    }
  }, []);

  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelsLoaded) return;

      // If we have registered faces, do full recognition
      if (faceMatcherRef.current) {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          onFaceDetected(true);
          const match = faceMatcherRef.current.findBestMatch(detection.descriptor);
          if (match.label !== "unknown") {
            const [userId, name] = match.label.split("|");
            setFaceStatus({ type: "success", text: `Recognized: ${name}` });
            onFaceRecognized?.(userId, name, match.distance);
          } else {
            setFaceStatus({ type: "warning", text: "Face not recognized" });
          }
        } else {
          onFaceDetected(false);
          setFaceStatus({ type: "error", text: "No face detected" });
        }
      } else {
        // Fallback: detection only
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
        );
        const detected = detections.length > 0;
        onFaceDetected(detected);
        setFaceStatus({ type: detected ? "success" : "error", text: detected ? "Face detected" : "No face detected" });
      }
    }, 700);
  }, [modelsLoaded, onFaceDetected, onFaceRecognized]);

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

  const statusColor = faceStatus.type === "success"
    ? "text-green-700 bg-green-50 border-green-200"
    : faceStatus.type === "warning"
    ? "text-yellow-700 bg-yellow-50 border-yellow-200"
    : faceStatus.type === "error"
    ? "text-red-700 bg-red-50 border-red-200"
    : "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <div className="relative w-full aspect-[4/3] bg-gray-100 rounded border border-gray-300 overflow-hidden">
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

      <div className={`px-4 py-2 rounded text-xs flex items-center justify-center gap-1.5 font-medium border ${statusColor}`}>
        {faceStatus.type === "success" && <CheckCircle2 className="w-4 h-4" />}
        {faceStatus.type === "warning" && <AlertTriangle className="w-4 h-4" />}
        {faceStatus.type === "error" && <XCircle className="w-4 h-4" />}
        {faceStatus.type === "info" && <Loader2 className="w-4 h-4 animate-spin" />}
        {faceStatus.text}
      </div>
    </div>
  );
}

export type { RegisteredFace };
