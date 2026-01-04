import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { getEventByCode, subscribeToEvent, addParticipant, updateEvent } from '../lib/firebase'
import { sendParticipantConfirmationEmail } from '../lib/email'
import { useEventStore } from '../stores/eventStore'
import ParticipantCard from '../components/features/ParticipantCard'
import JoinEventModal from '../components/JoinEventModal'
import type { Participant, Event } from '../types'

export default function EventPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const { updateEvent: updateEventInStore } = useEventStore()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Check if current user is already a participant (by email in localStorage)
  useEffect(() => {
    if (event) {
      // Check by participant ID first (for backward compatibility)
      const storedParticipantId = localStorage.getItem(`participant_${event.id}`)
      if (storedParticipantId) {
        const isParticipant = event.participants.some((p) => p.id === storedParticipantId)
        if (isParticipant) {
          setCurrentParticipantId(storedParticipantId)
          return
        }
      }

      // Check by email (new method)
      const storedEmail = localStorage.getItem(`participant_email_${event.code}`)
      if (storedEmail) {
        const participant = event.participants.find((p) => p.email === storedEmail)
        if (participant) {
          setCurrentParticipantId(participant.id)
          localStorage.setItem(`participant_${event.id}`, participant.id)
        }
      }
    }
  }, [event])

  // Fetch event and set up real-time subscription
  useEffect(() => {
    if (!code) {
      setError('No event code provided')
      setIsLoading(false)
      return
    }

    const fetchAndSubscribe = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initial fetch by code
        const fetchedEvent = await getEventByCode(code)
        if (!fetchedEvent) {
          setError('Event not found. Please check the code and try again.')
          setIsLoading(false)
          return
        }

        setEvent(fetchedEvent)
        updateEventInStore(fetchedEvent)

        // Set up real-time subscription
        unsubscribeRef.current = subscribeToEvent(fetchedEvent.id, (updatedEvent, err) => {
          if (err) {
            console.error('Real-time subscription error:', err)
            return
          }
          if (updatedEvent) {
            setEvent(updatedEvent)
            updateEventInStore(updatedEvent)
          }
        })

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching event:', err)
        setError(err instanceof Error ? err.message : 'Failed to load event')
        setIsLoading(false)
      }
    }

    fetchAndSubscribe()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [code, updateEventInStore])

  const handleJoinEvent = async (formData: { name: string; email: string; wishlist?: string[] }) => {
    if (!event) return

    setIsJoining(true)
    setError(null)
    setJoinSuccess(false)

    try {
      const newParticipant: Omit<Participant, 'id' | 'eventId' | 'joinedAt'> = {
        name: formData.name,
        email: formData.email,
        wishlist: formData.wishlist,
        isReady: false,
      }

      // Save participant to Firestore
      await addParticipant(event.id, newParticipant)

      // Get updated event to find the new participant ID
      const updatedEvent = await getEventByCode(code!)
      if (updatedEvent) {
        const newParticipantObj = updatedEvent.participants.find(
          (p) => p.name === formData.name && p.email === formData.email
        )
        if (newParticipantObj) {
          setCurrentParticipantId(newParticipantObj.id)
          
          // Store participant info in localStorage for return visits
          localStorage.setItem(`participant_${event.id}`, newParticipantObj.id)
          localStorage.setItem(`participant_email_${event.code}`, formData.email)
          localStorage.setItem(`participant_name_${event.code}`, formData.name)
        }
        setEvent(updatedEvent)
      }

      // Send confirmation email (placeholder)
      try {
        await sendParticipantConfirmationEmail(
          formData.email,
          formData.name,
          event.name,
          event.code
        )
      } catch (emailError) {
        // Don't fail the join if email fails
        console.warn('Failed to send confirmation email:', emailError)
      }

      // Show success message
      setJoinSuccess(true)
      setShowJoinModal(false)

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setJoinSuccess(false)
      }, 5000)
    } catch (err) {
      console.error('Error joining event:', err)
      setError(err instanceof Error ? err.message : 'Failed to join event')
    } finally {
      setIsJoining(false)
    }
  }

  const handleMarkReady = async () => {
    if (!event || !currentParticipantId) return

    try {
      const updatedParticipants = event.participants.map((p) =>
        p.id === currentParticipantId ? { ...p, isReady: !p.isReady } : p
      )

      await updateEvent(event.id, { participants: updatedParticipants })
    } catch (err) {
      console.error('Error updating ready status:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-christmas-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            {error || 'Event Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The event you\'re looking for doesn\'t exist.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/join')}
              className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
            >
              Try Another Code
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentParticipant = currentParticipantId
    ? event.participants.find((p) => p.id === currentParticipantId)
    : null
  // Note: We can't use useAuth here because participants don't need accounts
  // For organizer check, we'll rely on the admin route protection
  const isOrganizer = false // This will be checked server-side or via admin route

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-christmas-red-600 hover:text-christmas-red-700 font-semibold mb-4"
          >
            ← Back to Home
          </button>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
                🎄 {event.name}
              </h1>
              <p className="text-gray-600">
                Event Code: <span className="font-mono font-bold text-christmas-red-600">{event.code}</span>
              </p>
            </div>
            {isOrganizer && (
              <button
                onClick={() => navigate(`/event/${code}/admin`)}
                className="px-4 py-2 bg-christmas-red-500 text-white rounded-lg font-semibold hover:bg-christmas-red-600 transition-colors text-sm"
              >
                🔒 Admin
              </button>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-christmas-red-50 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">📅 Exchange Date</div>
              <div className="font-bold text-christmas-red-600">
                {format(new Date(event.date), 'MMM d, yyyy')}
              </div>
            </div>
            {event.budget && (
              <div className="p-4 bg-christmas-gold-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">💰 Budget</div>
                <div className="font-bold text-christmas-gold-600">${event.budget}</div>
              </div>
            )}
            <div className="p-4 bg-christmas-green-50 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">👥 Participants</div>
              <div className="font-bold text-christmas-green-600">{event.participants.length}</div>
            </div>
          </div>
          {event.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700">{event.description}</p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {joinSuccess && (
          <div className="mb-6 p-4 bg-christmas-green-50 border-2 border-christmas-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <h3 className="font-bold text-christmas-green-700 mb-1">You're In!</h3>
                <p className="text-sm text-christmas-green-600">
                  Check your email for confirmation. You've successfully joined this Secret Santa event.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Join/Status Section */}
        {!currentParticipant ? (
          <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-christmas-green-600 mb-4">
                Join This Event
              </h2>
              <p className="text-gray-600 mb-6">
                Add your name, email, and wishlist to participate in this Secret Santa
              </p>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-8 py-4 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
              >
                Join Event
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-christmas-green-600 mb-2">
                You're In!
              </h2>
              <p className="text-gray-600 mb-6">
                You've joined this Secret Santa event
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentParticipant.isReady}
                    onChange={handleMarkReady}
                    className="w-5 h-5 text-christmas-green-500 rounded focus:ring-christmas-green-500"
                  />
                  <span className="font-semibold text-gray-700">I'm ready for the draw</span>
                </label>
              </div>
              {currentParticipant.wishlist && currentParticipant.wishlist.length > 0 && (
                <div className="mt-6 p-4 bg-christmas-gold-50 rounded-xl">
                  <h3 className="font-bold text-christmas-gold-600 mb-2">Your Wishlist:</h3>
                  <ul className="list-disc list-inside text-left">
                    {currentParticipant.wishlist.map((item, idx) => (
                      <li key={idx} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            Participants ({event.participants.length})
          </h2>
          {event.participants.length === 0 ? (
            <p className="text-gray-600">No participants yet. Be the first to join!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Event Modal */}
      <JoinEventModal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false)
          setError(null)
        }}
        onSubmit={handleJoinEvent}
        isSubmitting={isJoining}
        error={error}
      />
    </div>
  )
}
