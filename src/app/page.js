'use client'
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6">

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl bg-amber-400 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">

        {/* Logo */}
        <div className="text-center">
          <p className="text-amber-500 text-xs tracking-[0.4em] uppercase font-mono mb-3">School Portal</p>
          <h1 className="text-white text-5xl font-black tracking-tighter leading-none">
            EDU<span className="text-amber-400">GATE</span>
          </h1>
        </div>

        {/* Student buttons */}
        <div className="w-full flex flex-col gap-3">
          <p className="text-neutral-600 text-[10px] uppercase tracking-[0.3em] font-mono text-center">Student</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/student/login">
              <button className="w-full py-3.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white text-sm font-semibold hover:border-sky-500/50 hover:bg-neutral-800 transition-all active:scale-95">
                Login
              </button>
            </Link>
            <Link href="/student/register">
              <button className="w-full py-3.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white text-sm font-semibold hover:border-sky-500/50 hover:bg-neutral-800 transition-all active:scale-95">
                Register
              </button>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-neutral-900" />

        {/* Teacher buttons */}
        <div className="w-full flex flex-col gap-3 -mt-4">
          <p className="text-neutral-600 text-[10px] uppercase tracking-[0.3em] font-mono text-center">Teacher</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/teacher/login">
              <button className="w-full py-3.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white text-sm font-semibold hover:border-amber-500/50 hover:bg-neutral-800 transition-all active:scale-95">
                Login
              </button>
            </Link>
            <Link href="/teacher/register">
              <button className="w-full py-3.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white text-sm font-semibold hover:border-amber-500/50 hover:bg-neutral-800 transition-all active:scale-95">
                Register
              </button>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-neutral-900" />

        {/* Admin button */}
        <div className="w-full -mt-4">
          <p className="text-neutral-600 text-[10px] uppercase tracking-[0.3em] font-mono text-center mb-3">Admin</p>
          <Link href="/admin">
            <button className="w-full py-3.5 rounded-xl bg-amber-500 text-black text-sm font-black tracking-wide hover:bg-amber-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              Admin Login →
            </button>
          </Link>
        </div>

      </div>
    </main>
  );
}