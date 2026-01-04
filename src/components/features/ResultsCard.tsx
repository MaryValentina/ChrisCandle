import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import type { Participant, Assignment } from '../../types'

interface ResultsCardProps {
  assignment: Assignment
  receiver: Participant
  onSendMessage?: () => void
}

export default function ResultsCard({
  assignment,
  receiver,
  onSendMessage,
}: ResultsCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ef4444', '#22c55e', '#f59e0b'], // Christmas colors
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ef4444', '#22c55e', '#f59e0b'],
      })
    }, 250)

    // Reveal animation
    setTimeout(() => setIsRevealed(true), 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-br from-christmas-red-50 via-christmas-green-50 to-christmas-gold-50 rounded-2xl shadow-christmas-lg border-4 border-christmas-red-300 p-6 md:p-8 relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-christmas-red-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-christmas-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>

      <div className="relative z-10 text-center">
        {/* Reveal Animation */}
        <div
          className={`transition-all duration-1000 ${
            isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="mb-6">
            <div className="text-6xl md:text-8xl mb-4 animate-bounce">🎁</div>
            <h2 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
              You got...
            </h2>
          </div>

          {/* Receiver Name */}
          <div className="mb-8">
            <div className="inline-block px-8 py-4 bg-white rounded-2xl shadow-christmas-lg border-4 border-christmas-green-400 transform hover:scale-105 transition-transform">
              <h3 className="text-4xl md:text-5xl font-bold text-christmas-green-600 mb-2">
                {receiver.name}!
              </h3>
              <div className="text-2xl">🎄</div>
            </div>
          </div>

          {/* Contact Information */}
          {receiver.email && (
            <div className="mb-6 p-4 bg-white rounded-xl shadow-md">
              <div className="text-sm text-gray-600 mb-2 font-semibold">Contact Info:</div>
              <div className="space-y-2">
                {receiver.email && (
                  <div className="flex items-center justify-center gap-2 text-christmas-red-600">
                    <span>📧</span>
                    <a
                      href={`mailto:${receiver.email}`}
                      className="hover:underline"
                    >
                      {receiver.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wishlist */}
          {receiver.wishlist && receiver.wishlist.length > 0 && (
            <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
              <h4 className="text-xl font-bold text-christmas-gold-600 mb-4 flex items-center justify-center gap-2">
                <span>🎁</span>
                <span>Wishlist</span>
              </h4>
              <div className="space-y-2">
                {receiver.wishlist.map((item, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-christmas-gold-50 rounded-lg text-christmas-gold-700 font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Button */}
          {onSendMessage && (
            <button
              onClick={onSendMessage}
              className="w-full sm:w-auto px-8 py-4 bg-christmas-red-500 text-white rounded-xl font-bold text-lg hover:bg-christmas-red-600 transition-colors shadow-christmas-lg transform hover:scale-105"
            >
              💌 Send Anonymous Message
            </button>
          )}

          {/* Revealed timestamp */}
          {assignment.revealedAt && (
            <div className="mt-6 text-sm text-gray-500">
              Revealed on{' '}
              {new Date(assignment.revealedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

