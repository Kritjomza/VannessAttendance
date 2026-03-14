"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

// ── Types ──────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  check_type: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  users: { name: string };
}

interface Settings {
  id: string;
  company_name: string;
  company_lat: number;
  company_lng: number;
  allowed_distance: number;
  admin_password: string;
}

type Tab = "records" | "settings";

// ── Admin Page (with auth gate) ────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("records");
  const router = useRouter();

  // Check if admin is logged in (localStorage token exists and < 24h)
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const loginTime = localStorage.getItem("admin_login_time");

    if (token && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (elapsed < ONE_DAY) {
        setAuthenticated(true);
      } else {
        // Session expired
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_login_time");
        router.push("/admin/login");
      }
    } else {
      router.push("/admin/login");
    }
    setChecking(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_login_time");
    router.push("/admin/login");
  };

  if (checking || !authenticated) {
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
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <a href="/" className="text-blue-100 hover:text-white text-sm mb-2 inline-block transition-colors">← Back</a>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl text-sm font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10 pb-10">
        {/* Tab buttons */}
        <div className="glass rounded-2xl shadow-lg shadow-indigo-500/5 p-1.5 flex gap-1.5 mb-6">
          {(["records", "settings"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
              }`}
            >
              {tab === "records" ? "📋 Records" : "⚙️ Settings"}
            </button>
          ))}
        </div>

        {activeTab === "records" ? <RecordsTab /> : <SettingsTab />}
      </div>
    </main>
  );
}

// ── Records Tab ────────────────────────────────────────

function RecordsTab() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance")
      .select("id, check_type, created_at, latitude, longitude, users(name)")
      .order("created_at", { ascending: sortAsc });
    if (error) console.error("Error:", error);
    else setRecords((data as unknown as AttendanceRecord[]) || []);
    setLoading(false);
  }, [sortAsc]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const formatCheckType = (type: string) => {
    const labels: Record<string, string> = {
      morning_checkin: "🌅 Morning Check-in", lunch_checkout: "🍽️ Lunch Check-out",
      afternoon_checkin: "☀️ Afternoon Check-in", evening_checkout: "🌙 Evening Check-out",
    };
    return labels[type] || type;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        <button onClick={fetchRecords} className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 hover:text-slate-800 transition-colors shadow-sm">
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">No attendance records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-left text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Check Type</th>
                  <th className="px-5 py-3 font-semibold cursor-pointer hover:text-slate-700 select-none transition-colors" onClick={() => setSortAsc(!sortAsc)}>
                    Time {sortAsc ? "↑" : "↓"}
                  </th>
                  <th className="px-5 py-3 font-semibold">Lat</th>
                  <th className="px-5 py-3 font-semibold">Lng</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 transition-colors ${i % 2 === 0 ? "bg-slate-50/30" : ""}`}>
                    <td className="px-5 py-3 text-slate-700 font-medium">{r.users?.name || "Unknown"}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCheckType(r.check_type)}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatTime(r.created_at)}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{r.latitude?.toFixed(6) ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{r.longitude?.toFixed(6) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyLat, setCompanyLat] = useState(13.7563);
  const [companyLng, setCompanyLng] = useState(100.5018);
  const [allowedDistance, setAllowedDistance] = useState(200);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from("settings").select("*").limit(1).single();
      if (error) console.error("Error:", error);
      else if (data) {
        setSettings(data);
        setCompanyName(data.company_name);
        setCompanyLat(data.company_lat);
        setCompanyLng(data.company_lng);
        setAllowedDistance(data.allowed_distance);
        setAdminPassword(data.admin_password);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setCompanyLat(parseFloat(lat.toFixed(6)));
    setCompanyLng(parseFloat(lng.toFixed(6)));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("settings").update({
      company_name: companyName,
      company_lat: companyLat,
      company_lng: companyLng,
      allowed_distance: allowedDistance,
      admin_password: adminPassword,
    }).eq("id", settings.id);

    setMessage(error ? { type: "error", text: "Failed to save settings" } : { type: "success", text: "Settings saved successfully!" });
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!settings) {
    return <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200"><p>No settings found. Run schema.sql first.</p></div>;
  }

  return (
    <div className="space-y-5">
      {/* Company Name */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          placeholder="Enter company name" />
      </div>

      {/* Allowed Distance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Allowed Distance (meters)</label>
        <input type="number" value={allowedDistance} min={1}
          onChange={(e) => setAllowedDistance(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
        <p className="text-xs text-slate-400 mt-2">Users must be within this distance to check in.</p>
      </div>

      {/* Admin Password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin Password</label>
        <input type="text" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          placeholder="Set admin password" />
        <p className="text-xs text-slate-400 mt-2">Password required to access the admin dashboard.</p>
      </div>

      {/* Map Picker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Company Location</label>
        <p className="text-xs text-slate-500 mb-3">Click on the map to set your company&apos;s location. The blue circle shows the allowed check-in radius.</p>
        <MapPicker lat={companyLat} lng={companyLng} radius={allowedDistance} onLocationChange={handleLocationChange} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Latitude</label>
            <input type="text" value={companyLat} readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Longitude</label>
            <input type="text" value={companyLng} readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-mono" />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm text-center font-medium ${
          message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-300/30">
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...
          </span>
        ) : "💾 Save Settings"}
      </button>
    </div>
  );
}
