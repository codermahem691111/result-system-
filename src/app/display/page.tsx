'use client'

import React from 'react'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios';
import  {io}  from 'socket.io-client';


function DisplayNotifi() {
  
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    // Fetch existing notifications
    const fetchNotifications = async () => {
      const res = await axios.get(
        'http://localhost:5000/api/notifications'
      )
      setNotifications(res.data)
    }

    fetchNotifications()

    // Create socket connection
    socketRef.current = io('http://localhost:5000')

    // Listen for new notifications
    socketRef.current.on('newNotification', (data) => {
      setNotifications((prev) => [data, ...prev])
    })

    // Cleanup
    return () => {
      socketRef.current.disconnect()
    }
  }, [])
    return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Notifications
        </h2>

        <ul className="space-y-4">
          {notifications.map((n) => (
            <li key={n._id} className="border-b pb-3">
              <p className="text-gray-800">{n.message}</p>
              <span className="text-sm text-gray-500">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default DisplayNotifi
