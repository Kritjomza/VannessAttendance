"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { haversineDistance } from "@/utils/distance";
import Camera from "@/components/Camera";
import type { RegisteredFace } from "@/components/Camera";
import AttendanceButtons from "@/components/AttendanceButtons";
import { ArrowLeft, MapPin, MapPinOff, AlertTriangle, CheckCircle2, XCircle, Camera as CameraIcon, Fullscreen } from "lucide-react";

interface UserData { id: string; name: string; face_descriptor: string | null; }
interface CompanySettings { company_lat: number; company_lng: number; allowed_distance: number; company_name: string; }

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [user, setUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [checkType, setCheckType] = useState("morning_checkin");
  const [faceDetected, setFaceDetected] = useState(false);
  const [recognizedUserId, setRecognizedUserId] = useState<string | null>(null);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<{ icon: React.ReactNode; text: string }>({ icon: <Fullscreen className="w-3 h-3" />, text: "Detecting location..." });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  useEffect(() => {
    if (!userId) { router.push("/"); return; }
    async function fetchData() {
      const { data: userData, error: userError } = await supabase
        .from("users").select("id, name, face_descriptor").eq("id", userId).single();
      if (userError || !userData) { router.push("/"); return; }
      setUser(userData);

      const { data: usersData } = await supabase
        .from("users").select("id, name, face_descriptor").not("face_descriptor", "is", null);
      if (usersData) setAllUsers(usersData);

      const { data: settingsData } = await supabase
        .from("settings").select("company_lat, company_lng, allowed_distance, company_name").limit(1).single();
      if (settingsData) setSettings(settingsData);
    }
    fetchData();
  }, [userId, router]);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus({ icon: <XCircle className="w-3 h-3 text-red-500" />, text: "Geolocation not supported" }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus({ icon: <MapPin className="w-3 h-3 text-green-500" />, text: "Location acquired" }); },
      () => setLocationStatus({ icon: <MapPinOff className="w-3 h-3 text-red-500" />, text: "Location access denied" }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const registeredFaces: RegisteredFace[] = useMemo(() => {
    return allUsers
      .filter((u) => u.face_descriptor)
      .map((u) => ({
        userId: u.id,
        name: u.name,
        descriptor: new Float32Array(JSON.parse(u.face_descriptor!)),
      }));
  }, [allUsers]);

  const handleFaceDetected = useCallback((detected: boolean) => setFaceDetected(detected), []);

  const handleFaceRecognized = useCallback((recUserId: string, recName: string) => {
    setRecognizedUserId(recUserId);
    setRecognizedName(recName);
  }, []);

  const faceMatchesUser = recognizedUserId === userId;
  const hasRegisteredFaces = registeredFaces.length > 0;
  const currentUserHasFace = user?.face_descriptor != null;

  const handleCheckIn = async () => {
    setMessage(null);
    if (!faceDetected) { setMessage({ type: "error", text: "No face detected. Please look at the camera." }); return; }
    if (!location) { setMessage({ type: "error", text: "Location not available. Please enable GPS." }); return; }
    if (!user || !settings) { setMessage({ type: "error", text: "Settings not loaded. Please try again." }); return; }

    if (hasRegisteredFaces && currentUserHasFace) {
      if (!recognizedUserId) {
        setMessage({ type: "error", text: "Face not recognized. Please look at the camera clearly." });
        return;
      }
      if (!faceMatchesUser) {
        setMessage({ type: "error", text: `Face mismatch! Recognized as "${recognizedName}" but you selected "${user.name}".` });
        return;
      }
    }

    const distance = haversineDistance(location.lat, location.lng, settings.company_lat, settings.company_lng);
    if (distance > settings.allowed_distance) {
      setMessage({ type: "error", text: `Outside allowed area (${Math.round(distance)}m away, max ${settings.allowed_distance}m)` });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("attendance").insert({ user_id: user.id, check_type: checkType, latitude: location.lat, longitude: location.lng });
      if (error) throw error;
      setMessage({ type: "success", text: "Check-in recorded successfully!" });
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setMessage({ type: "error", text: "Failed to record check-in. Please try again." });
    } finally { setIsSubmitting(false); }
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 pt-10 pb-10 mb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 text-sm mb-3 inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            <span className="px-3 py-1 rounded bg-gray-100 items-center text-gray-700 text-xs font-medium flex gap-1.5">
              {locationStatus.icon} {locationStatus.text}
            </span>
            {settings && (
              <span className="text-gray-500 text-xs">
                {settings.company_name} · max {settings.allowed_distance}m
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Camera card */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 mb-5">
          <Camera
            onFaceDetected={handleFaceDetected}
            onFaceRecognized={handleFaceRecognized}
            registeredFaces={registeredFaces}
          />

          {/* Face identity status */}
          {hasRegisteredFaces && faceDetected && (
            <div className={`mt-3 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-center border ${faceMatchesUser
                ? "bg-green-50 text-green-700 border-green-200"
                : recognizedUserId
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}>
              {faceMatchesUser
                ? <><CheckCircle2 className="w-4 h-4" /> Identity verified: {recognizedName}</>
                : recognizedUserId
                  ? <><AlertTriangle className="w-4 h-4" /> Recognized as &quot;{recognizedName}&quot; — mismatch!</>
                  : <><Fullscreen className="w-4 h-4 animate-pulse" /> Verifying identity...</>
              }
            </div>
          )}

          {!currentUserHasFace && (
            <div className="mt-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200">
              <AlertTriangle className="w-4 h-4" />
              <span>Face not registered. Ask admin to register your face for identity verification.</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Attendance Type</h2>
          <AttendanceButtons selected={checkType} onSelect={setCheckType} />
        </div>

        {message && (
          <div className={`mb-5 px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200"
              : message.type === "warning" ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <button onClick={handleCheckIn} disabled={isSubmitting}
          className="w-full py-3 px-6 rounded font-semibold text-base
                     bg-blue-600 text-white hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors shadow-sm">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <CameraIcon className="w-5 h-5" /> Scan Face & Check In
            </span>
          )}
        </button>
      </div>
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <CheckInContent />
    </Suspense>
  );
}
