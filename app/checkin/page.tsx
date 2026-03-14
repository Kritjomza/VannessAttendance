"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { haversineDistance } from "@/utils/distance";
import Camera from "@/components/Camera";
import AttendanceButtons from "@/components/AttendanceButtons";

interface UserData { id: string; name: string; }
interface CompanySettings { company_lat: number; company_lng: number; allowed_distance: number; company_name: string; }

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [user, setUser] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [checkType, setCheckType] = useState("morning_checkin");
  const [faceDetected, setFaceDetected] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Detecting location...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!userId) { router.push("/"); return; }
    async function fetchData() {
      const { data: userData, error: userError } = await supabase.from("users").select("id, name").eq("id", userId).single();
      if (userError || !userData) { router.push("/"); return; }
      setUser(userData);
      const { data: settingsData } = await supabase.from("settings").select("company_lat, company_lng, allowed_distance, company_name").limit(1).single();
      if (settingsData) setSettings(settingsData);
    }
    fetchData();
  }, [userId, router]);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus("❌ Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus("📍 Location acquired"); },
      () => setLocationStatus("❌ Location access denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleFaceDetected = useCallback((detected: boolean) => setFaceDetected(detected), []);

  const handleCheckIn = async () => {
    setMessage(null);
    if (!faceDetected) { setMessage({ type: "error", text: "No face detected. Please look at the camera." }); return; }
    if (!location) { setMessage({ type: "error", text: "Location not available. Please enable GPS." }); return; }
    if (!user || !settings) { setMessage({ type: "error", text: "Settings not loaded. Please try again." }); return; }

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
    <main className="min-h-screen bg-pattern">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white px-6 pt-10 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-lg mx-auto relative z-10">
          <button
            onClick={() => router.push("/")}
            className="text-blue-100 hover:text-white text-sm mb-3 inline-flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Hello, {user.name} 👋</h1>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium">
              {locationStatus}
            </span>
            {settings && (
              <span className="text-blue-200 text-xs">
                {settings.company_name} · max {settings.allowed_distance}m
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 pb-10">
        {/* Camera card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-indigo-500/5 p-4 mb-5">
          <Camera onFaceDetected={handleFaceDetected} />
        </div>

        {/* Attendance type */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Attendance Type
          </h2>
          <AttendanceButtons selected={checkType} onSelect={setCheckType} />
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm text-center font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {message.type === "success" ? "✅" : "⚠️"} {message.text}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleCheckIn}
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base
                     bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                     hover:from-indigo-500 hover:to-purple-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 active:scale-[0.98]
                     shadow-lg shadow-indigo-300/30"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            "📸 Scan Face & Check In"
          )}
        </button>
      </div>
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <CheckInContent />
    </Suspense>
  );
}
