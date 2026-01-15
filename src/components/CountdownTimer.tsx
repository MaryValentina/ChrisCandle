import { useState, useEffect } from 'react'
import type { FirestoreDate } from '../types'

interface CountdownTimerProps {
  eventDate: FirestoreDate
  eventTime?: string // Time in HH:mm format (e.g., "18:00")
  className?: string
}

export default function CountdownTimer({ eventDate, eventTime, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isPast: boolean
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Parse the date
      let date: Date
      if (typeof eventDate === 'string') {
        // Handle YYYY-MM-DD format strings
        if (eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = eventDate.split('-').map(Number)
          date = new Date(year, month - 1, day)
        } else {
          date = new Date(eventDate)
        }
      } else {
        date = eventDate
      }

      // If eventTime is provided, combine date and time
      if (eventTime) {
        const [hours, minutes] = eventTime.split(':').map(Number)
        date.setHours(hours, minutes || 0, 0, 0)
      } else {
        // Default to end of day if no time specified
        date.setHours(23, 59, 59, 999)
      }

      const now = new Date()
      const difference = date.getTime() - now.getTime()

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isPast: false,
      }
    }

    // Calculate immediately
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [eventDate, eventTime])

  if (!timeLeft) {
    return null
  }

  if (timeLeft.isPast) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-2xl font-bold text-christmas-red-600">
          Event Date Has Passed
        </div>
      </div>
    )
  }

  return (
    <div className={`text-center ${className}`} role="timer" aria-live="polite">
      <div className="text-sm text-gray-600 mb-2">Time Until Event</div>
      <div className="flex gap-4 justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-christmas-red-600">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Days</div>
        </div>
        <div className="text-2xl text-christmas-red-600">:</div>
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-christmas-red-600">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Hours</div>
        </div>
        <div className="text-2xl text-christmas-red-600">:</div>
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-christmas-red-600">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Minutes</div>
        </div>
        <div className="text-2xl text-christmas-red-600">:</div>
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-christmas-red-600">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500 uppercase">Seconds</div>
        </div>
      </div>
    </div>
  )
}
