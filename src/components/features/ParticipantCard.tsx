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
    <div className="bg-white rounded-xl shadow-christmas border-2 border-christmas-green-200 hover:border-christmas-red-300 transition-all duration-300 p-4 md:p-6 relative overflow-hidden">
      {/* Christmas ornament top hook */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-christmas-gold-500 rounded-full border-2 border-christmas-red-500"></div>
      
      {/* Ornament string */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-christmas-gold-300"></div>

      <div className="mt-6">
        {/* Name and Ready Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-christmas-red-600 mb-1">
              {participant.name}
            </h3>
            <div className="flex items-center gap-2">
              {participant.isReady ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-christmas-green-100 text-christmas-green-700 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 bg-christmas-green-500 rounded-full"></span>
                  Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Not Ready
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          {participant.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-christmas-red-500">📧</span>
              <a
                href={`mailto:${participant.email}`}
                className="hover:text-christmas-red-600 transition-colors"
              >
                {participant.email}
              </a>
            </div>
          )}
          {participant.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-christmas-green-500">📱</span>
              <a
                href={`tel:${participant.phone}`}
                className="hover:text-christmas-green-600 transition-colors"
              >
                {participant.phone}
              </a>
            </div>
          )}
        </div>

        {/* Wishlist Preview */}
        {participant.wishlist && participant.wishlist.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowWishlist(!showWishlist)}
              className="flex items-center gap-2 text-sm font-semibold text-christmas-gold-600 hover:text-christmas-gold-700 transition-colors"
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
                  <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-christmas-red-400">•</span>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            {onEdit && (
              <button
                onClick={() => onEdit(participant)}
                className="flex-1 px-4 py-2 bg-christmas-green-500 text-white rounded-lg font-semibold hover:bg-christmas-green-600 transition-colors text-sm"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(participant.id)}
                className="flex-1 px-4 py-2 bg-christmas-red-500 text-white rounded-lg font-semibold hover:bg-christmas-red-600 transition-colors text-sm"
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

