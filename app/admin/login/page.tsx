"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
    <main className="min-h-screen bg-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 shadow-lg shadow-indigo-300/30">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your admin password to continue</p>
        </div>

        {/* Login card */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 p-6">
          {/* Password input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                         text-slate-700 placeholder:text-slate-400 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm
                       bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                       hover:from-indigo-500 hover:to-purple-500
                       disabled:opacity-50 transition-all active:scale-[0.98]
                       shadow-md shadow-indigo-200"
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
            <a href="/" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
              ← Back to home
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
