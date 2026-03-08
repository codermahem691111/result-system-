"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    // No token → kick back to admin login
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    fetch("http://localhost:5000/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        // Invalid / expired token → kick back
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("adminToken");
          window.location.href = "/admin";
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => {
        window.location.href = "/admin";
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  }

  /* ── Loading ─────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-600 text-xs font-mono tracking-widest uppercase">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  /* ── Dashboard ───────────────────────────── */
  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 border-b border-neutral-900 bg-[#080808]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-lg tracking-tighter">
              EDU<span className="text-amber-400">GATE</span>
            </span>
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider">Admin</span>
          </div>
          <button
            onClick={logout}
            className="text-neutral-600 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            Logout
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-500 text-xs font-mono tracking-[0.3em] uppercase mb-2">Dashboard</p>
          <h1 className="text-4xl font-black tracking-tighter">Welcome back, Admin.</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Students", value: data.totalStudents, color: "text-sky-400", border: "border-sky-500/20" },
            { label: "Teachers", value: data.totalTeachers, color: "text-violet-400", border: "border-violet-500/20" },
            { label: "Total Members", value: data.totalStudents + data.totalTeachers, color: "text-amber-400", border: "border-amber-500/20" },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={`rounded-2xl border ${border} bg-neutral-900/50 p-6`}>
              <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider mb-3">{label}</p>
              <p className={`text-5xl font-black tracking-tighter ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserTable title="Students" users={data.students} color="sky" />
          <UserTable title="Teachers" users={data.teachers} color="violet" />
        </div>

      </div>
    </div>
  );
}

function UserTable({ title, users, color }) {
  const accent = color === "sky" ? "text-sky-400 bg-sky-500/10 border-sky-500/20" : "text-violet-400 bg-violet-500/10 border-violet-500/20";
  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-900 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">{title}</h2>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${accent}`}>{users.length}</span>
      </div>
      {users.length === 0 ? (
        <p className="text-neutral-700 text-sm font-mono text-center py-10">No records yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left text-neutral-600 text-[10px] font-mono uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-neutral-600 text-[10px] font-mono uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id} className={`border-t border-neutral-900 hover:bg-white/[0.02] transition-colors`}>
                <td className="px-5 py-3 text-sm text-white">{u.name}</td>
                <td className="px-5 py-3 text-sm text-neutral-500 font-mono">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}