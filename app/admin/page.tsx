"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";
import { CalendarClock, MapPin as MapPinIcon, Settings as SettingsIcon, Users, RefreshCw, Save, Camera, Check, AlertTriangle, ArrowLeft, Plus } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
const FaceRegister = dynamic(() => import("@/components/FaceRegister"), { ssr: false });

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

type Tab = "records" | "users" | "settings";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("records");
  const router = useRouter();

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 text-gray-900 px-6 pt-10 pb-10 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <a href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </a>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-gray-700 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-10">
        {/* Tab buttons */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-1.5 flex gap-1.5 mb-6">
          {(["records", "users", "settings"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 rounded text-sm font-semibold transition-colors ${activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              {tab === "records" ? "📋 Records" : tab === "users" ? "👥 Users" : "⚙️ Settings"}
            </button>
          ))}
        </div>

        {activeTab === "records" ? <RecordsTab /> : activeTab === "users" ? <UsersTab /> : <SettingsTab />}
      </div>
    </main>
  );
}

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
      morning_checkin: "Morning Check-in", lunch_checkout: "Lunch Check-out",
      afternoon_checkin: "Afternoon Check-in", evening_checkout: "Evening Check-out",
    };
    return labels[type] || type;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        <button onClick={fetchRecords} className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarClock className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium">No attendance records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-left text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Check Type</th>
                  <th className="px-5 py-3 font-semibold cursor-pointer hover:text-gray-700 select-none transition-colors" onClick={() => setSortAsc(!sortAsc)}>
                    Time {sortAsc ? "↑" : "↓"}
                  </th>
                  <th className="px-5 py-3 font-semibold">Lat</th>
                  <th className="px-5 py-3 font-semibold">Lng</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-900 font-medium">{r.users?.name || "Unknown"}</td>
                    <td className="px-5 py-3 text-gray-600">{formatCheckType(r.check_type)}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatTime(r.created_at)}</td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{r.latitude?.toFixed(6) ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{r.longitude?.toFixed(6) ?? "—"}</td>
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
    return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!settings) {
    return <div className="text-center py-16 text-gray-500 bg-white rounded border border-gray-200"><p>No settings found. Run schema.sql first.</p></div>;
  }

  return (
    <div className="space-y-4">
      {/* Company Name */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Company Name</label>
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter company name" />
      </div>

      {/* Allowed Distance */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Allowed Distance (meters)</label>
        <input type="number" value={allowedDistance} min={1}
          onChange={(e) => setAllowedDistance(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        <p className="text-xs text-gray-500 mt-2">Users must be within this distance to check in.</p>
      </div>

      {/* Admin Password */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Admin Password</label>
        <input type="text" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Set admin password" />
        <p className="text-xs text-gray-500 mt-2">Password required to access the admin dashboard.</p>
      </div>

      {/* Map Picker */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Company Location</label>
        <p className="text-xs text-gray-500 mb-3">Click on the map to set your company&apos;s location. The blue circle shows the allowed check-in radius.</p>
        <MapPicker lat={companyLat} lng={companyLng} radius={allowedDistance} onLocationChange={handleLocationChange} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
            <input type="text" value={companyLat} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-600 text-xs font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
            <input type="text" value={companyLng} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-600 text-xs font-mono" />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded text-sm flex items-center justify-center gap-2 font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {message.text}
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 px-6 rounded font-semibold text-base bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...
          </span>
        ) : "💾 Save Settings"}
      </button>
    </div>
  );
}

interface UserRecord {
  id: string;
  name: string;
  face_descriptor: string | null;
}

function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [registeringUser, setRegisteringUser] = useState<UserRecord | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("id, name, face_descriptor").order("name");
    if (error) console.error("Error:", error);
    else setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    setMessage(null);
    const { error } = await supabase.from("users").insert({ name: trimmed });
    if (error) setMessage({ type: "error", text: "Failed to add user" });
    else { setMessage({ type: "success", text: `Added "${trimmed}" successfully` }); setNewName(""); fetchUsers(); }
    setAdding(false);
  };

  const handleDelete = async (user: UserRecord) => {
    if (deletingId === user.id) {
      const { error } = await supabase.from("users").delete().eq("id", user.id);
      if (error) setMessage({ type: "error", text: "Failed to delete user" });
      else { setMessage({ type: "success", text: `Deleted "${user.name}"` }); fetchUsers(); }
      setDeletingId(null);
    } else {
      setDeletingId(user.id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleFaceRegistered = async (descriptor: number[]) => {
    if (!registeringUser) return;
    const { error, data } = await supabase
      .from("users")
      .update({ face_descriptor: JSON.stringify(descriptor) })
      .eq("id", registeringUser.id)
      .select();
      
    if (error || !data || data.length === 0) {
      setMessage({ type: "error", text: "Failed to save face data. Ensure RLS UPDATE policy exists." });
    } else { 
      setMessage({ type: "success", text: `Face registered for "${registeringUser.name}"` }); 
      fetchUsers(); 
    }
    setRegisteringUser(null);
  };

  return (
    <div>
      {/* Face Register Modal */}
      {registeringUser && (
        <FaceRegister
          onDescriptorCaptured={handleFaceRegistered}
          onClose={() => setRegisteringUser(null)}
        />
      )}

      {/* Add user form */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-4 mb-5">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Add New User</label>
        <div className="flex gap-2">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Enter user name"
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          <button onClick={handleAdd} disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
            {adding ? "Adding..." : <><Plus className="w-4 h-4" /> Add</>}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 px-4 py-3 rounded text-sm flex items-center justify-center gap-2 font-medium border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {message.text}
        </div>
      )}

      {/* User table */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        <button onClick={fetchUsers} className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3 text-gray-300" />
            <p className="font-medium">No users yet. Add one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user, i) => (
              <div key={user.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
                  {user.name.charAt(0)}
                </div>
                {/* Name + face status */}
                <div className="flex-1 min-w-0">
                  <span className="text-gray-900 font-medium text-sm block truncate">{user.name}</span>
                  <span className={`text-xs flex items-center gap-1 ${user.face_descriptor ? "text-green-600" : "text-gray-500"}`}>
                    {user.face_descriptor ? <><Check className="w-3 h-3" /> Face registered</> : "No face data"}
                  </span>
                </div>
                {/* Register Face button */}
                <button onClick={() => setRegisteringUser(user)}
                  className={`px-3 py-1.5 flex flex-row items-center gap-1.5 rounded text-xs font-medium transition-colors shrink-0 ${user.face_descriptor
                      ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    }`}>
                  {user.face_descriptor ? "Re-register" : <><Camera className="w-3.5 h-3.5" /> Register</>}
                </button>
                {/* Delete button */}
                <button onClick={() => handleDelete(user)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${deletingId === user.id ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    }`}>
                  {deletingId === user.id ? "Confirm?" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
