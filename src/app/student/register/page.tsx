"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", fathersName: "", class: "", password: "" });
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
        class: form.class.trim(),
        password: form.password,
      };
      const res = await fetch("http://localhost:5000/api/student/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
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
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-sky-400">Student Register</h1>
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
            type="text"
            placeholder="Father's Name"
            value={form.fathersName}
            onChange={(e) => setForm({ ...form, fathersName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-sky-500"
            required
          />
          <select
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-sky-500 appearance-none text-neutral-400"
            required
          >
            <option value="">Select Class (1-10)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n.toString()}>Class {n}</option>
            ))}
          </select>
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
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
