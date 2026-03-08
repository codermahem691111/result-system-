"use client";
import { useEffect, useState } from "react";

export default function TeacherDashboard() {
  const [ready, setReady] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [myCourses, setMyCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [results, setResults] = useState({}); // { studentId: { mid, final } }
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  function getTeacherToken() {
    return document.cookie.split("; ").find(row => row.startsWith("teacherToken="))?.split("=")[1];
  }

  useEffect(() => {
    setReady(true);
    const token = getTeacherToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setTeacherName(payload.name || "Teacher");
      } catch (e) {
        console.error("Failed to decode token", e);
      }

      // Fetch my courses
      fetch("http://localhost:5000/api/teacher/my-courses", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => setMyCourses(json.courses || []))
      .catch(err => console.error("Failed to fetch courses", err));
    }
  }, []);

  async function handleViewStudents(course) {
    setSelectedClass(course.className);
    setSelectedSubject(course.subject);
    setLoading(true);
    const token = getTeacherToken();
    try {
      // Fetch students
      const res = await fetch(`http://localhost:5000/api/teacher/courses/${course.className}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setStudents(json.students || []);

      // Fetch existing results
      const resRes = await fetch(`http://localhost:5000/api/teacher/courses/${course.className}/results/${course.subject}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jsonRes = await resRes.json();
      
      const resMap = {};
      (jsonRes.results || []).forEach(r => {
        resMap[r.studentId] = { mid: r.mid, final: r.final };
      });
      setResults(resMap);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveResult(studentId) {
    setSavingId(studentId);
    const token = getTeacherToken();
    const mid = results[studentId]?.mid || 0;
    const final = results[studentId]?.final || 0;

    try {
      const res = await fetch("http://localhost:5000/api/teacher/results", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          className: selectedClass,
          subject: selectedSubject,
          mid,
          final
        })
      });
      const json = await res.json();
      if (json.error) alert(json.error);
      else {
        // Success feedback (could be a toast)
      }
    } catch (err) {
      console.error("Failed to save result", err);
    } finally {
      setSavingId(null);
    }
  }

  function handleMarkChange(studentId, field, value) {
    const val = Math.min(100, Math.max(0, Number(value) || 0));
    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { mid: 0, final: 0 }),
        [field]: val
      }
    }));
  }

  function logout() {
    document.cookie = "teacherToken=; Max-Age=0; path=/";
    window.location.href = "/";
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
            EDU<span className="text-amber-400">GATE</span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all active:scale-95 text-sm"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-purple-400">Welcome, {teacherName}</h1>
        <p className="text-neutral-400 mb-6">You are assigned to the following courses.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">My Assigned Courses</h2>
            <div className="flex flex-col gap-3">
              {myCourses.length === 0 ? (
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950 text-neutral-600 text-sm italic">
                  No courses assigned yet.
                </div>
              ) : (
                myCourses.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleViewStudents(c)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedClass === c.className && selectedSubject === c.subject
                        ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                        : "bg-neutral-950 border-neutral-900 text-neutral-300 hover:border-neutral-800"
                    }`}
                  >
                    <p className="text-xs font-mono mb-1">Class {c.className}</p>
                    <p className="font-bold">{c.subject}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Students List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {selectedClass ? `Students in Class ${selectedClass} - ${selectedSubject}` : "Select a course to view students"}
            </h2>
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !selectedClass ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-600 italic">
                  <span className="text-2xl mb-2">☝️</span>
                  <span>Select a course from the left to view the student list</span>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-600 italic">
                  <span>No students registered for Class {selectedClass} yet.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-900/50 border-b border-neutral-800">
                        <th className="px-6 py-4 text-left text-neutral-400 font-semibold uppercase tracking-wider text-xs">Name</th>
                        <th className="px-6 py-4 text-center text-neutral-400 font-semibold uppercase tracking-wider text-xs">Mid (100)</th>
                        <th className="px-6 py-4 text-center text-neutral-400 font-semibold uppercase tracking-wider text-xs">Final (100)</th>
                        <th className="px-6 py-4 text-right text-neutral-400 font-semibold uppercase tracking-wider text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {students.map((s) => (
                        <tr key={s._id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-neutral-200 font-medium">{s.name}</p>
                            <p className="text-[10px] text-neutral-600 font-mono">{s.email}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              value={results[s._id]?.mid ?? 0}
                              onChange={(e) => handleMarkChange(s._id, "mid", e.target.value)}
                              className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-center text-amber-400 focus:outline-none focus:border-amber-500/50"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              value={results[s._id]?.final ?? 0}
                              onChange={(e) => handleMarkChange(s._id, "final", e.target.value)}
                              className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-center text-purple-400 focus:outline-none focus:border-purple-500/50"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSaveResult(s._id)}
                              disabled={savingId === s._id}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                savingId === s._id
                                  ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              }`}
                            >
                              {savingId === s._id ? "..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
