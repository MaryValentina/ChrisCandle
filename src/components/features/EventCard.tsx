import type { Event } from '../../types'

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
  onShare?: (event: Event) => void
  onStartDraw?: (event: Event) => void
  showActions?: boolean
}

export default function EventCard({
  event,
  onEdit,
  onShare,
  onStartDraw,
  showActions = true,
}: EventCardProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'open':
        return 'bg-christmas-green-100 text-christmas-green-700'
      case 'closed':
        return 'bg-christmas-gold-100 text-christmas-gold-700'
      case 'assigned':
        return 'bg-christmas-red-100 text-christmas-red-700'
      case 'revealed':
        return 'bg-purple-100 text-purple-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const canStartDraw =
    event.participants.length >= 2 &&
    event.participants.every(p => p.isReady) &&
    event.status !== 'assigned' &&
    event.status !== 'revealed' &&
    event.status !== 'completed'

  return (
    <div className="bg-gradient-to-br from-white to-christmas-red-50 rounded-2xl shadow-christmas-lg border-2 border-christmas-red-200 hover:border-christmas-green-300 transition-all duration-300 p-6 md:p-8 relative overflow-hidden">
      {/* Festive border decoration */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-christmas-red-500 via-christmas-green-500 to-christmas-gold-500"></div>

      {/* Event Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl md:text-3xl font-bold text-christmas-red-600 flex-1">
            🎄 {event.name}
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
              event.status
            )}`}
          >
            {event.status}
          </span>
        </div>

        {event.description && (
          <p className="text-gray-600 text-sm md:text-base mb-4">{event.description}</p>
        )}
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-christmas-red-50 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">📅 Date</div>
          <div className="font-bold text-christmas-red-600">{formatDate(event.date)}</div>
        </div>

        <div className="p-4 bg-christmas-green-50 rounded-xl">
          <div className="text-sm text-gray-600 mb-1">👥 Participants</div>
          <div className="font-bold text-christmas-green-600">
            {event.participants.length}
          </div>
        </div>

        {event.spendingLimit && (
          <div className="p-4 bg-christmas-gold-50 rounded-xl">
            <div className="text-sm text-gray-600 mb-1">💰 Budget</div>
            <div className="font-bold text-christmas-gold-600">
              ${event.spendingLimit}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (onEdit || onShare || onStartDraw) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="flex-1 px-4 py-2 bg-christmas-green-500 text-white rounded-lg font-semibold hover:bg-christmas-green-600 transition-colors"
            >
              Edit Event
            </button>
          )}
          {onShare && (
            <button
              onClick={() => onShare(event)}
              className="flex-1 px-4 py-2 bg-christmas-gold-500 text-white rounded-lg font-semibold hover:bg-christmas-gold-600 transition-colors"
            >
              Share
            </button>
          )}
          {onStartDraw && canStartDraw && (
            <button
              onClick={() => onStartDraw(event)}
              className="flex-1 px-4 py-2 bg-christmas-red-500 text-white rounded-lg font-semibold hover:bg-christmas-red-600 transition-colors shadow-christmas"
            >
              🎁 Start Draw
            </button>
          )}
          {onStartDraw && !canStartDraw && (
            <div className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold text-center text-sm">
              {event.participants.length < 2
                ? 'Need 2+ participants'
                : !event.participants.every(p => p.isReady)
                ? 'All participants must be ready'
                : 'Draw already completed'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

