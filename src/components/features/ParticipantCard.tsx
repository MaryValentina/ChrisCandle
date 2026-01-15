import { useState } from 'react'
import type { Participant } from '../../types'

interface ParticipantCardProps {
  participant: Participant
  onEdit?: (participant: Participant) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

export default function ParticipantCard({
  participant,
  onEdit,
  onDelete,
  showActions = true,
}: ParticipantCardProps) {
  const [showWishlist, setShowWishlist] = useState(false)

  return (
    <div className="bg-christmas-red-dark/40 backdrop-blur-sm rounded-xl shadow-gold border border-gold/20 hover:border-gold/40 transition-all duration-300 p-4 md:p-6 relative overflow-hidden">
      {/* Christmas ornament top hook */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gold rounded-full border-2 border-gold/60"></div>
      
      {/* Ornament string */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gold/60"></div>

      <div className="mt-6">
        {/* Name and Ready Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-gold mb-1">
              {participant.name}
            </h3>
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

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          {participant.email && (
            <div className="flex items-center gap-2 text-sm text-snow-white/70">
              <span className="text-gold">📧</span>
              <a
                href={`mailto:${participant.email}`}
                className="hover:text-gold transition-colors"
              >
                {participant.email}
              </a>
            </div>
          )}
        </div>

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

