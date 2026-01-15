import { useState } from 'react'
import type { Participant } from '../../types'

interface ParticipantCardProps {
  participant: Participant
  onEdit?: (participant: Participant) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  isMatch?: boolean
}

export default function ParticipantCard({
  participant,
  onEdit,
  onDelete,
  showActions = true,
  isMatch = false,
}: ParticipantCardProps) {
  const [showWishlist, setShowWishlist] = useState(false)

  return (
    <div className={`bg-christmas-red-dark/40 backdrop-blur-sm rounded-xl shadow-gold border transition-all duration-300 p-4 md:p-6 relative overflow-hidden ${
      isMatch 
        ? 'border-gold border-4 shadow-[0_0_30px_rgba(251,191,36,0.6)] scale-[1.02]' 
        : 'border-gold/20 hover:border-gold/40'
    }`}>
      {isMatch && (
        <div className="absolute -inset-1 bg-gradient-to-r from-gold via-gold-light to-gold rounded-xl blur-lg opacity-75 animate-pulse -z-10"></div>
      )}
      {/* Christmas ornament top hook */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gold rounded-full border-2 border-gold/60"></div>
      
      {/* Ornament string */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gold/60"></div>

      <div className="mt-6">
        {/* Name and Ready Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl md:text-2xl font-bold text-gold">
                {participant.name}
              </h3>
              {isMatch && (
                <span className="px-3 py-1 bg-gold/20 border border-gold/40 rounded-full text-xs font-semibold text-gold animate-pulse">
                  🎯 Your Match!
                </span>
              )}
            </div>
            {participant.isOrganizer && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-christmas-gold-100 to-christmas-gold-200 text-christmas-gold-800 rounded-full text-xs font-semibold border border-christmas-gold-400">
                  <span className="text-sm">👑</span>
                  Organizer
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information - Hidden for privacy */}
        {/* Emails are hidden to prevent cheating - participants can only see their own match */}

        {/* Wishlist Preview */}
        {participant.wishlist && participant.wishlist.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowWishlist(!showWishlist)}
              className="flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light transition-colors"
            >
              <span>🎁</span>
              <span>Wishlist ({participant.wishlist.length} items)</span>
              <span className={`transform transition-transform ${showWishlist ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {showWishlist && (
              <div className="mt-2 pl-6 space-y-1">
                {participant.wishlist.map((item, index) => (
                  <div key={index} className="text-sm text-snow-white/80 flex items-center gap-2">
                    <span className="text-gold">•</span>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-4 border-t border-gold/20">
            {onEdit && (
              <button
                onClick={() => onEdit(participant)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-christmas-red-deep rounded-lg font-semibold hover:scale-105 transition-transform shadow-gold text-sm"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(participant.id)}
                className="flex-1 px-4 py-2 border-2 border-red-400/50 text-red-300 bg-transparent rounded-lg font-semibold hover:bg-red-500/20 transition-colors text-sm"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

