"use client";
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const [ready, setReady] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [myCourses, setMyCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  function getStudentToken() {
    return document.cookie.split("; ").find(row => row.startsWith("studentToken="))?.split("=")[1];
  }

  useEffect(() => {
    setReady(true);
    const token = getStudentToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setStudentName(payload.name || "Student");
        setStudentClass(payload.class || "N/A");
      } catch (e) {
        console.error("Failed to decode token", e);
      }

      // Fetch my courses
      fetch("http://localhost:5000/api/student/my-courses", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => setMyCourses(json.courses || []))
      .catch(err => console.error("Failed to fetch courses", err));

      // Fetch results
      fetch("http://localhost:5000/api/student/my-results", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => setResults(json.results || []))
      .catch(err => console.error("Failed to fetch results", err));
    }
  }, []);

  function getResultForSubject(subject) {
    return results.find(r => r.subject === subject) || { mid: "-", final: "-" };
  }

  function logout() {
    document.cookie = "studentToken=; Max-Age=0; path=/";
    window.location.href = "/";
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <nav className="border-b border-neutral-900 bg-[#080808]/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="font-black tracking-tight">
            EDU<span className="text-sky-400">GATE</span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-sky-500/50 transition-all active:scale-95 text-sm"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-sky-400">Welcome, {studentName}</h1>
        <p className="text-neutral-400 mb-8">You are currently enrolled in Class {studentClass}.</p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">My Subjects & Teachers</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResults(!showResults)}
                className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  showResults
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
                    : "bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20"
                }`}
              >
                {showResults ? "Hide Results" : "View Results"}
              </button>
              <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs font-mono">
                Class {studentClass}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden shadow-2xl">
            {myCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-600 italic">
                <span className="text-3xl mb-3">📚</span>
                <span>No subjects assigned to your class yet.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-900/50 border-b border-neutral-800">
                      <th className="px-6 py-4 text-left text-neutral-400 font-semibold uppercase tracking-wider text-xs">Subject</th>
                      <th className="px-6 py-4 text-left text-neutral-400 font-semibold uppercase tracking-wider text-xs">Assigned Teacher</th>
                      {showResults && (
                        <>
                          <th className="px-6 py-4 text-center text-amber-400 font-semibold uppercase tracking-wider text-xs">Mid (100)</th>
                          <th className="px-6 py-4 text-center text-purple-400 font-semibold uppercase tracking-wider text-xs">Final (100)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {myCourses.map((c) => {
                      const res = getResultForSubject(c.subject);
                      return (
                        <tr key={c._id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                📖
                              </span>
                              <span className="text-neutral-200 font-medium">{c.subject}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {c.teacherName ? (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-neutral-300 font-medium">{c.teacherName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-neutral-600 italic">
                                <span className="w-2 h-2 rounded-full bg-neutral-800" />
                                <span>Not yet assigned</span>
                              </div>
                            )}
                          </td>
                          {showResults && (
                            <>
                              <td className="px-6 py-4 text-center font-mono text-amber-400 font-bold">{res.mid}</td>
                              <td className="px-6 py-4 text-center font-mono text-purple-400 font-bold">{res.final}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="rounded-2xl border border-neutral-900 p-6 bg-neutral-950/50 backdrop-blur">
              <p className="text-sm text-neutral-500 font-medium mb-1">Upcoming Tasks</p>
              <p className="text-neutral-400 text-sm">Check back later for assignments and tests.</p>
            </div>
            <div className="rounded-2xl border border-neutral-900 p-6 bg-neutral-950/50 backdrop-blur">
              <p className="text-sm text-neutral-500 font-medium mb-1">Resource Center</p>
              <p className="text-neutral-400 text-sm">Access textbooks and learning materials here.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
