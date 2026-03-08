"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", fathersName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        fathersName: form.fathersName.trim(),
        password: form.password,
      };
      const res = await fetch("http://localhost:5000/api/teacher/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      const token: string = json.token;
      document.cookie = `teacherToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push("/teacher/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-neutral-900 rounded-2xl p-6 bg-neutral-950">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Teacher Register</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-amber-500"
            required
          />
          <input
            type="text"
            placeholder="Father's Name"
            value={form.fathersName}
            onChange={(e) => setForm({ ...form, fathersName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-amber-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-amber-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-semibold transition-all active:scale-95"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
