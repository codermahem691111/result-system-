'use client'
import React from 'react'
import { useState } from 'react'
import axios from 'axios'
const page = () => {
    const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!message.trim()) return

    try {
      await axios.post('http://localhost:5000/api/notification', {
        message,
      })
      setMessage('')
    } catch (err) {
      console.error(err)
    }
  }

 
 
 
 
 
 
    return (
   <div className="flex justify-center mt-10">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Create Notification
        </h2>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your notification..."
            className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Send Notification
          </button>
        </form>
      </div>
    </div>
    
  )
}

export default page
