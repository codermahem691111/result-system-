"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // 'addStudent' | 'addTeacher' | 'viewStudents' | 'viewTeachers'
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [listData, setListData] = useState({ students: [], teachers: [] });
  const [courses, setCourses] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [studentForm, setStudentForm] = useState({ name: "", fathersName: "", dateOfBirth: "", class: "" });
  const [teacherForm, setTeacherForm] = useState({ name: "", fathersName: "", dateOfGraduation: "" });
  const [courseForm, setCourseForm] = useState({ className: "", subject: "" });
  const [assignForm, setAssignForm] = useState({ courseId: "", teacherId: "", teacherName: "" });

  function getToken() {
    return document.cookie.split("; ").find((row) => row.startsWith("adminToken="))?.split("=")[1];
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = "/admin"; return; }

    const fetchDash = fetch("http://localhost:5000/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());

    const fetchCourses = fetch("http://localhost:5000/api/admin/courses", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());

    const fetchTeachers = fetch("http://localhost:5000/api/admin/teachers", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());

    Promise.all([fetchDash, fetchCourses, fetchTeachers])
      .then(([dash, coursesData, teachersData]) => {
        if (dash.error) throw new Error();
        setData(dash);
        setCourses(coursesData.courses || []);
        setListData(prev => ({ ...prev, teachers: teachersData.teachers || [] }));
      })
      .catch(() => { /* window.location.href = "/admin"; */ })
      .finally(() => setLoading(false));
  }, []);

  async function fetchCourses() {
    const token = getToken();
    try {
      const res = await fetch("http://localhost:5000/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setCourses(json.courses || []);
    } catch {
      showToast("Failed to fetch courses", "error");
    }
  }

  async function handleAddCourse(e) {
    e.preventDefault();
    setFormLoading(true);
    const token = getToken();
    try {
      const res = await fetch("http://localhost:5000/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(courseForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("Course added successfully!");
      setCourseForm({ className: "", subject: "" });
      fetchCourses();
    } catch (err) {
      showToast(err.message || "Failed to add course", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleAssignTeacher(courseId, teacherId, teacherName, canonicalTeacherName) {
    const token = getToken();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${courseId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teacherId, teacherName, canonicalTeacherName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("Teacher assigned successfully!");
      fetchCourses();
    } catch (err) {
      showToast(err.message || "Failed to assign teacher", "error");
    }
  }

  async function handleDeleteCourse(id) {
    const token = getToken();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast("Course deleted successfully!");
      fetchCourses();
    } catch {
      showToast("Failed to delete course", "error");
    }
  }

  async function fetchList(type) {
    setListLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setListData((prev) => ({ ...prev, [type]: json[type] || [] }));
    } catch {
      showToast("Failed to fetch list", "error");
    } finally {
      setListLoading(false);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === "viewStudents") fetchList("students");
    if (tab === "viewTeachers") fetchList("teachers");
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setFormLoading(true);
    const token = getToken();
    try {
      const res = await fetch("http://localhost:5000/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(studentForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("Student added successfully!");
      setStudentForm({ name: "", fathersName: "", dateOfBirth: "", class: "" });
    } catch (err) {
      showToast(err.message || "Failed to add student", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleAddTeacher(e) {
    e.preventDefault();
    setFormLoading(true);
    const token = getToken();
    try {
      const res = await fetch("http://localhost:5000/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(teacherForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("Teacher added successfully!");
      setTeacherForm({ name: "", fathersName: "", dateOfGraduation: "" });
    } catch (err) {
      showToast(err.message || "Failed to add teacher", "error");
    } finally {
      setFormLoading(false);
    }
  }

  function logout() {
    document.cookie = "adminToken=; path=/; max-age=0; SameSite=Strict";
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-orange-500/30 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-zinc-600 text-xs font-mono tracking-[0.2em] uppercase animate-pulse">Authenticating</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30">
      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl transition-all duration-300 ${
          toast.type === "error"
            ? "bg-red-950/90 border-red-500/40 text-red-300"
            : "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
        }`}>
          <span className="text-lg">{toast.type === "error" ? "✗" : "✓"}</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-zinc-950 font-black text-sm">E</span>
              </div>
              <span className="text-zinc-100 font-bold text-lg tracking-tight">EduGate</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Admin Portal</span>
          </div>
          <button
            onClick={logout}
            className="group flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-zinc-900"
          >
            <span>Sign out</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <p className="text-orange-500 text-xs font-mono uppercase tracking-[0.2em]">System Active</p>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-100 mb-2">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Manage your institution's users and monitor activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Students" value={data.totalStudents} icon="👨‍🎓" gradient="from-blue-500/20 to-cyan-500/20" accent="text-blue-400" />
          <StatCard label="Teachers" value={data.totalTeachers} icon="👨‍🏫" gradient="from-purple-500/20 to-pink-500/20" accent="text-purple-400" />
          <StatCard label="Total Members" value={data.totalStudents + data.totalTeachers} icon="👥" gradient="from-orange-500/20 to-red-500/20" accent="text-orange-400" highlighted />
        </div>

        {/* ─── COURSE MANAGEMENT SECTION ─── */}
        <div className="mb-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <h2 className="text-zinc-100 font-semibold">Course & Teacher Assignment</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Course Form */}
                <div className="space-y-4">
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Add New Subject</p>
                  <form onSubmit={handleAddCourse} className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🏫</span>
                      <select
                        value={courseForm.className}
                        onChange={(e) => setCourseForm(p => ({ ...p, className: e.target.value }))}
                        className="w-full bg-zinc-800/60 border border-zinc-700 hover:border-zinc-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/20 text-zinc-200 text-sm rounded-xl pl-10 pr-4 py-3 appearance-none transition-all duration-200"
                        required
                      >
                        <option value="">Select Class (1-10)</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>Class {n}</option>
                        ))}
                      </select>
                    </div>
                    <InputField
                      placeholder="Subject Name (e.g. Mathematics)"
                      value={courseForm.subject}
                      onChange={(v) => setCourseForm(p => ({ ...p, subject: v }))}
                      icon="📚"
                    />
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 text-zinc-950 text-sm font-bold py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    >
                      Add Subject
                    </button>
                  </form>
                </div>

                {/* Course List & Assignment */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Current Assignments</p>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/20">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-900/50 sticky top-0">
                          <tr className="border-b border-zinc-800">
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase">Class</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase">Subject</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase">Teacher</th>
                            <th className="px-4 py-3 text-right text-zinc-500 text-xs font-semibold uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {courses.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-zinc-600 italic">No courses added yet</td>
                            </tr>
                          ) : courses.map((c) => (
                            <tr key={c._id} className="hover:bg-zinc-800/20 transition-colors">
                              <td className="px-4 py-3 font-mono text-orange-400 font-bold">Class {c.className}</td>
                              <td className="px-4 py-3 text-zinc-200 font-medium">{c.subject}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={c.teacherId || ""}
                                  onChange={(e) => {
                                    const t = listData.teachers.find(t => t._id === e.target.value);
                                    handleAssignTeacher(c._id, e.target.value, t ? t.name : "", t ? t.canonicalName : "");
                                  }}
                                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500/50"
                                >
                                  <option value="">Unassigned</option>
                                  {listData.teachers.map(t => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteCourse(c._id)}
                                  className="text-zinc-600 hover:text-red-400 transition-colors"
                                  title="Delete Subject"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MANAGEMENT SECTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* STUDENT PANEL */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h2 className="text-zinc-100 font-semibold">Student Management</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Add Student Form */}
              <form onSubmit={handleAddStudent} className="space-y-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Add New Student</p>
                <InputField
                  placeholder="Full Name"
                  value={studentForm.name}
                  onChange={(v) => setStudentForm((p) => ({ ...p, name: v }))}
                  icon="👤"
                />
                <InputField
                  placeholder="Father's Name"
                  value={studentForm.fathersName}
                  onChange={(v) => setStudentForm((p) => ({ ...p, fathersName: v }))}
                  icon="👨"
                />
                <InputField
                  placeholder="Date of Birth"
                  type="date"
                  value={studentForm.dateOfBirth}
                  onChange={(v) => setStudentForm((p) => ({ ...p, dateOfBirth: v }))}
                  icon="📅"
                />
                <InputField
                  placeholder="Class (e.g. Grade 10-A)"
                  value={studentForm.class}
                  onChange={(v) => setStudentForm((p) => ({ ...p, class: v }))}
                  icon="🏫"
                />
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>+</span>
                      <span>Add Student</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* View Students */}
              <button
                onClick={() => handleTabChange(activeTab === "viewStudents" ? null : "viewStudents")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  activeTab === "viewStudents"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>📋</span>
                  <span>View Students List</span>
                </span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${activeTab === "viewStudents" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Students List */}
              {activeTab === "viewStudents" && (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  {listLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : listData.students.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 text-sm">No students added yet</div>
                  ) : (
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-zinc-900">
                          <tr className="border-b border-zinc-800">
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">Father</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">DOB</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">Class</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {listData.students.map((s) => (
                            <tr key={s._id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-3 text-zinc-200 font-medium">{s.name}</td>
                              <td className="px-4 py-3 text-zinc-400">{s.fathersName}</td>
                              <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{s.dateOfBirth}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs font-mono">{s.class}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TEACHER PANEL */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <h2 className="text-zinc-100 font-semibold">Teacher Management</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Add Teacher Form */}
              <form onSubmit={handleAddTeacher} className="space-y-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Add New Teacher</p>
                <InputField
                  placeholder="Full Name"
                  value={teacherForm.name}
                  onChange={(v) => setTeacherForm((p) => ({ ...p, name: v }))}
                  icon="👤"
                />
                <InputField
                  placeholder="Father's Name"
                  value={teacherForm.fathersName}
                  onChange={(v) => setTeacherForm((p) => ({ ...p, fathersName: v }))}
                  icon="👨"
                />
                <InputField
                  placeholder="Date of Graduation"
                  type="date"
                  value={teacherForm.dateOfGraduation}
                  onChange={(v) => setTeacherForm((p) => ({ ...p, dateOfGraduation: v }))}
                  icon="🎓"
                />
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/40 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>+</span>
                      <span>Add Teacher</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-600 text-xs">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* View Teachers */}
              <button
                onClick={() => handleTabChange(activeTab === "viewTeachers" ? null : "viewTeachers")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  activeTab === "viewTeachers"
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>📋</span>
                  <span>View Teachers List</span>
                </span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${activeTab === "viewTeachers" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Teachers List */}
              {activeTab === "viewTeachers" && (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  {listLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : listData.teachers.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 text-sm">No teachers added yet</div>
                  ) : (
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-zinc-900">
                          <tr className="border-b border-zinc-800">
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">Father</th>
                            <th className="px-4 py-3 text-left text-zinc-500 text-xs font-semibold uppercase tracking-wider">Graduation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {listData.teachers.map((t) => (
                            <tr key={t._id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-3 text-zinc-200 font-medium">{t.name}</td>
                              <td className="px-4 py-3 text-zinc-400">{t.fathersName}</td>
                              <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{t.dateOfGraduation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Original registered users tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserTable title="Registered Students" users={data.students} type="student" />
          <UserTable title="Registered Teachers" users={data.teachers} type="teacher" />
        </div>
      </main>
    </div>
  );
}

function InputField({ placeholder, value, onChange, icon, type = "text" }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-zinc-800/60 border border-zinc-700 hover:border-zinc-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/20 text-zinc-200 placeholder:text-zinc-600 text-sm rounded-xl pl-10 pr-4 py-3 transition-all duration-200"
      />
    </div>
  );
}

function StatCard({ label, value, icon, gradient, accent, highlighted }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
      highlighted
        ? "bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 shadow-lg shadow-orange-500/10"
        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
    }`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <span className="text-2xl">{icon}</span>
          <span className={`text-xs font-mono px-2 py-1 rounded-full border ${
            highlighted ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
          }`}>Live</span>
        </div>
        <p className="text-zinc-500 text-sm font-medium mb-1">{label}</p>
        <p className={`text-4xl font-bold tracking-tight ${accent}`}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function UserTable({ title, users, type }) {
  const isStudent = type === "student";
  const accentClass = isStudent ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-purple-400 bg-purple-500/10 border-purple-500/20";
  const accentColor = isStudent ? "blue" : "purple";

  
}