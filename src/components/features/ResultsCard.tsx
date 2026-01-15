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
  isHighlighted = false,
  showReceiverDetails = true,
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
    <div className="bg-christmas-red-dark/50 backdrop-blur-sm rounded-2xl shadow-gold-lg border-4 border-gold/40 p-6 md:p-8 relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>

      <div className="relative z-10 text-center">
        {/* Reveal Animation */}
        <div
          className={`transition-all duration-1000 ${
            isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="mb-6">
            <div className="text-6xl md:text-8xl mb-4 animate-bounce">🎁</div>
            <h2 className="font-display text-3xl md:text-4xl text-gradient-gold mb-2">
              {isHighlighted ? '🎯 Your Match!' : 'Match'}
            </h2>
            {isHighlighted && (
              <div className="mt-2 px-4 py-2 bg-gold/20 border border-gold/40 rounded-full inline-block">
                <span className="text-gold font-semibold text-sm">This is your match!</span>
              </div>
            )}
          </div>

          {/* Receiver Details - Only show if this is the user's match or showReceiverDetails is true */}
          {showReceiverDetails && receiver ? (
            <>
              {/* Receiver Name */}
              <div className="mb-8">
                <div className="inline-block px-8 py-4 bg-christmas-red-dark/60 backdrop-blur-md rounded-2xl shadow-gold-lg border-4 border-gold/60 transform hover:scale-105 transition-transform">
                  <h3 className="font-display text-4xl md:text-5xl text-gradient-gold mb-2">
                    {receiver.name}!
                  </h3>
                  <div className="text-2xl">🎄</div>
                </div>
              </div>

              {/* Contact Information */}
              {receiver.email && (
                <div className="mb-6 p-4 bg-christmas-red-dark/40 border border-gold/20 rounded-xl backdrop-blur-sm">
                  <div className="text-sm text-snow-white/60 mb-2 font-semibold">Contact Info:</div>
                  <div className="space-y-2">
                    {receiver.email && (
                      <div className="flex items-center justify-center gap-2 text-gold">
                        <span>📧</span>
                        <a
                          href={`mailto:${receiver.email}`}
                          className="hover:text-gold-light transition-colors"
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
                <div className="mb-6 p-6 bg-christmas-red-dark/40 border border-gold/20 rounded-xl backdrop-blur-sm">
                  <h4 className="font-display text-xl text-gradient-gold mb-4 flex items-center justify-center gap-2">
                    <span>🎁</span>
                    <span>Wishlist</span>
                  </h4>
                  <div className="space-y-2">
                    {receiver.wishlist.map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-lg text-gold font-medium"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mb-8">
              <div className="inline-block px-8 py-4 bg-christmas-red-dark/40 backdrop-blur-md rounded-2xl border-2 border-gold/30">
                <p className="text-snow-white/60 text-lg">
                  {isHighlighted ? 'Match details hidden' : '🔒 Match hidden'}
                </p>
                <p className="text-snow-white/40 text-sm mt-2">
                  Only the participant can see their match
                </p>
              </div>
            </div>
          )}

          {/* Message Button */}
          {onSendMessage && (
            <button
              onClick={onSendMessage}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-gold-lg"
            >
              💌 Send Anonymous Message
            </button>
          )}

          {/* Revealed timestamp */}
          {assignment.revealedAt && (
            <div className="mt-6 text-sm text-snow-white/60">
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

