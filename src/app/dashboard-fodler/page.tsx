'use client';
import { useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function Dashboard() {
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/admin-login";
    } else {
      axios
        .get("http://localhost:5000/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {
          window.location.href = "/admin-login";
        });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard, i will fuck it again</h1>

      {/* Example Link Button */}
     
    </div>
  );
}
