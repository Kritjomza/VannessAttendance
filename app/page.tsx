"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  name: string;
}

/**
 * Home Page — User Selection with searchable table/grid.
 */
export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("id, name").order("name");
      if (error) console.error("Error fetching users:", error);
      else setUsers(data || []);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Filter users by search query
  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-pattern">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white px-6 pt-12 pb-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Attendance System</h1>
              <p className="text-blue-100 text-sm">Select your name to check in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10 pb-10">
        {/* Search bar */}
        <div className="glass rounded-2xl shadow-lg shadow-indigo-500/5 p-1.5 mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-slate-200 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400
                         text-slate-700 placeholder:text-slate-400 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {/* User grid/table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-500 font-medium">
              {search ? "No results found" : "No users found"}
            </p>
            {!search && (
              <p className="text-slate-400 text-sm mt-1">Run schema.sql in Supabase first.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</span>
            </div>

            {/* Table rows */}
            {filtered.map((user, index) => (
              <div
                key={user.id}
                className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-3.5 
                           border-b border-slate-50 last:border-b-0
                           hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                onClick={() => router.push(`/checkin?userId=${user.id}`)}
              >
                {/* Row number */}
                <span className="text-xs text-slate-400 font-mono w-6 text-center">{index + 1}</span>

                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                                  flex items-center justify-center text-white text-sm font-bold
                                  group-hover:shadow-md group-hover:shadow-indigo-200 transition-shadow shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-slate-700 font-semibold text-sm truncate">{user.name}</span>
                </div>

                {/* Check-in button */}
                <button
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-semibold 
                             rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all 
                             hover:shadow-md hover:shadow-indigo-200 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/checkin?userId=${user.id}`);
                  }}
                >
                  Check In
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-400">
            {filtered.length} of {users.length} users
          </p>
          <a
            href="/admin"
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            Admin Dashboard →
          </a>
        </div>
      </div>
    </main>
  );
}
