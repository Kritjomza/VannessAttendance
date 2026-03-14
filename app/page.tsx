"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ClipboardList, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
}

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

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 pt-12 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Attendance System</h1>
              <p className="text-gray-500 text-sm">Select your name to check in</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-10 pb-10">
        <div className="mb-6 border border-gray-200 bg-white rounded shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded border-0
                         focus:outline-none focus:ring-1 focus:ring-blue-500
                         text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {search ? "No results found" : "No users found"}
            </p>
            {!search && (
              <p className="text-slate-400 text-sm mt-1">Run schema.sql in Supabase first.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">#</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</span>
            </div>

            {filtered.map((user, index) => (
              <div
                key={user.id}
                className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-5 py-3 
                           border-b border-gray-100 last:border-b-0
                           hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/checkin?userId=${user.id}`)}
              >

                <span className="text-xs text-gray-400 font-mono w-6 text-center">{index + 1}</span>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-gray-900 font-medium text-sm truncate">{user.name}</span>
                </div>

                <button
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-medium 
                             rounded hover:bg-blue-700 transition-colors"
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

        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-500">
            {filtered.length} of {users.length} users
          </p>
          <a
            href="/admin"
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Admin Dashboard →
          </a>
        </div>
      </div>
    </main>
  );
}
