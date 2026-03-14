"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Lock, AlertTriangle, ArrowLeft } from "lucide-react";

/**
 * Admin Login Page — simple password-based authentication.
 * Checks password against the settings table in Supabase.
 */
export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Fetch admin password from settings
      const { data, error: fetchError } = await supabase
        .from("settings")
        .select("admin_password")
        .limit(1)
        .single();

      if (fetchError || !data) {
        setError("Unable to verify. Please try again.");
        setLoading(false);
        return;
      }

      // Simple password comparison
      if (password === data.admin_password) {
        // Generate a simple session token and store in localStorage
        const token = btoa(`admin_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_login_time", Date.now().toString());
        router.push("/admin");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded bg-gray-200 mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your admin password to continue</p>
        </div>

        {/* Login card */}
        <form onSubmit={handleLogin} className="bg-white rounded border border-gray-200 shadow-sm p-6">
          {/* Password input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded 
                         text-gray-900 placeholder:text-gray-400 text-sm
                         focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-semibold text-sm
                       bg-blue-600 text-white hover:bg-blue-700
                       disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Back link */}
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to home
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
