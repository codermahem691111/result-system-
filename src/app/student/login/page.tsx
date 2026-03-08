"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { name: form.name.trim(), password: form.password };
      const res = await fetch("http://localhost:5000/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      const token: string = json.token;
      document.cookie = `studentToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-neutral-900 rounded-2xl p-6 bg-neutral-950">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-sky-400">Student Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-sky-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-sky-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-white font-semibold transition-all active:scale-95"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
