'use client'

import { useState, useEffect } from 'react'
import { Phone, Clock } from 'lucide-react'

export default function TopPromoBar() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 20,
    minutes: 22,
    seconds: 50
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 0, minutes: 0, seconds: 0 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-green-600 text-white py-2 text-sm">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              FREE delivery & 10% Discount for new 3 orders! Place your first order now.
            </span>
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-bold">
                {timeLeft.hours} Hour {timeLeft.minutes} Min {timeLeft.seconds} Sec
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Need help? Call Us: +258 3284 214 85</span>
            </div>
            <div className="flex items-center space-x-2">
              <select className="bg-transparent border-none text-white text-sm">
                <option>English</option>
                <option>Italian</option>
                <option>Russian</option>
                <option>Chinese</option>
              </select>
              <select className="bg-transparent border-none text-white text-sm">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
