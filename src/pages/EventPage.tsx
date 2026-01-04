import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { getEventByCode, subscribeToEvent, addParticipant, updateEvent, getAssignments, createEvent as createFirebaseEvent } from '../lib/firebase'
import { sendWelcomeEmail } from '../lib/email'
import { useEventStore } from '../stores/eventStore'
import { checkAndExpireEvent, getEventStatusMessage, recreateEventForNextYear } from '../lib/eventExpiry'
import ParticipantCard from '../components/features/ParticipantCard'
import JoinEventModal from '../components/JoinEventModal'
import ResultsCard from '../components/features/ResultsCard'
import { useAuth } from '../contexts/AuthContext'
import type { Participant, Event, Assignment } from '../types'

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
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isRecreating, setIsRecreating] = useState(false)
  const [showRecreateModal, setShowRecreateModal] = useState(false)
  const { organizerId } = useAuth()
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

        // Check and expire event if needed (if date passed > 7 days)
        try {
          const wasExpired = await checkAndExpireEvent(fetchedEvent)
          if (wasExpired) {
            // Refetch to get updated status
            const updatedEvent = await getEventByCode(code)
            if (updatedEvent) {
              setEvent(updatedEvent)
              updateEventInStore(updatedEvent)
            } else {
              setEvent(fetchedEvent)
              updateEventInStore(fetchedEvent)
            }
          } else {
            setEvent(fetchedEvent)
            updateEventInStore(fetchedEvent)
          }
        } catch (expiryError) {
          // Don't fail the page load if expiry check fails
          console.warn('Error checking event expiry:', expiryError)
          setEvent(fetchedEvent)
          updateEventInStore(fetchedEvent)
        }

        // Fetch assignments if event is drawn
        if (fetchedEvent.status === 'drawn') {
          setIsLoadingAssignments(true)
          try {
            const fetchedAssignments = await getAssignments(fetchedEvent.id)
            setAssignments(fetchedAssignments)
          } catch (err) {
            console.error('Error fetching assignments:', err)
          } finally {
            setIsLoadingAssignments(false)
          }
        }

        // Set up real-time subscription
        unsubscribeRef.current = subscribeToEvent(fetchedEvent.id, async (updatedEvent, err) => {
          if (err) {
            console.error('Real-time subscription error:', err)
            return
          }
          if (updatedEvent) {
            setEvent(updatedEvent)
            updateEventInStore(updatedEvent)

            // Fetch assignments if status changed to drawn
            if (updatedEvent.status === 'drawn' && assignments.length === 0) {
              setIsLoadingAssignments(true)
              try {
                const fetchedAssignments = await getAssignments(updatedEvent.id)
                setAssignments(fetchedAssignments)
              } catch (err) {
                console.error('Error fetching assignments:', err)
              } finally {
                setIsLoadingAssignments(false)
              }
            }
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

      // Send welcome email
      try {
        const eventLink = `${window.location.origin}/event/${event.code}`
        await sendWelcomeEmail({
          participantEmail: formData.email,
          participantName: formData.name,
          eventName: event.name,
          eventCode: event.code,
          eventDate: event.date,
          eventLink,
        })
      } catch (emailError) {
        // Don't fail the join if email fails
        console.warn('Failed to send welcome email:', emailError)
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

  // Find the current participant's assignment (if event is drawn)
  const currentParticipantAssignment = currentParticipantId && event.status === 'drawn'
    ? assignments.find((a) => a.giverId === currentParticipantId)
    : null

  // Find the receiver (match) for the current participant
  const currentParticipantMatch = currentParticipantAssignment
    ? event.participants.find((p) => p.id === currentParticipantAssignment.receiverId)
    : null

  // Check if current user is the organizer
  const isOrganizer = organizerId && event ? event.organizerId === organizerId : false

  // Get event status message
  const statusMessage = event ? getEventStatusMessage(event) : null

  const handleRecreateEvent = async () => {
    if (!event || !organizerId) return

    setIsRecreating(true)
    try {
      const newEventId = await recreateEventForNextYear(event, async (eventData) => {
        return await createFirebaseEvent(eventData)
      })

      // Navigate to dashboard where they can see the new event
      navigate('/dashboard')
    } catch (err) {
      console.error('Error recreating event:', err)
      setError('Failed to recreate event. Please try again.')
    } finally {
      setIsRecreating(false)
      setShowRecreateModal(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentParticipantMatch || !messageText.trim()) return

    setIsSendingMessage(true)
    try {
      // TODO: Implement anonymous message sending
      // This would typically send an email or notification to the receiver
      // For now, we'll just log it
      console.log('Sending anonymous message:', {
        from: currentParticipant?.name,
        to: currentParticipantMatch.name,
        message: messageText,
      })

      // Placeholder: In a real app, you'd call an API or Firebase function here
      // await sendAnonymousMessage({
      //   eventId: event.id,
      //   fromParticipantId: currentParticipantId,
      //   toParticipantId: currentParticipantMatch.id,
      //   message: messageText,
      // })

      alert('Message sent! (This is a placeholder - message functionality coming soon)')
      setShowMessageModal(false)
      setMessageText('')
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsSendingMessage(false)
    }
  }

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

        {/* Event Expired/Completed Banner */}
        {(event.status === 'expired' || event.status === 'completed') && (
          <div className={`mb-6 p-6 rounded-2xl border-2 ${
            event.status === 'expired'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="text-center">
              <div className="text-5xl mb-4">
                {event.status === 'expired' ? '⏰' : '✅'}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${
                event.status === 'expired'
                  ? 'text-red-700'
                  : 'text-blue-700'
              }`}>
                Event Completed
              </h2>
              <p className={`mb-4 ${
                event.status === 'expired'
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`}>
                {statusMessage?.message || 'This event has ended.'}
              </p>
              {statusMessage?.canRecreate && isOrganizer && (
                <button
                  onClick={() => setShowRecreateModal(true)}
                  className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
                >
                  🎄 Recreate for Next Year
                </button>
              )}
            </div>
          </div>
        )}

        {/* Event Status Message (for active events) */}
        {event.status !== 'expired' && event.status !== 'completed' && statusMessage && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            statusMessage.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-center ${
              statusMessage.type === 'warning'
                ? 'text-yellow-700'
                : 'text-blue-600'
            }`}>
              {statusMessage.message}
            </p>
          </div>
        )}

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

        {/* Join/Status Section - Disabled if event is expired */}
        {event.status === 'expired' || event.status === 'completed' ? (
          <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-600 mb-4">
                Event Closed
              </h2>
              <p className="text-gray-600 mb-6">
                This event is no longer accepting new participants.
              </p>
            </div>
          </div>
        ) : !currentParticipant ? (
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
              {event.status !== 'drawn' && (
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
              )}
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

        {/* Your Match Section - Only shown if event is drawn and participant has an assignment */}
        {event.status === 'drawn' && currentParticipant && currentParticipantAssignment && currentParticipantMatch && (
          <div className="mb-6">
            {isLoadingAssignments ? (
              <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-christmas-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your match...</p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-christmas-red-600 mb-4 text-center">
                  🎁 Your Secret Santa Match
                </h2>
                <ResultsCard
                  assignment={currentParticipantAssignment}
                  receiver={currentParticipantMatch}
                  onSendMessage={() => setShowMessageModal(true)}
                />
              </div>
            )}
          </div>
        )}

        {/* Draw Status Message */}
        {event.status === 'drawn' && currentParticipant && !currentParticipantAssignment && !isLoadingAssignments && (
          <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
            <div className="text-4xl mb-2">⏳</div>
            <h3 className="font-bold text-yellow-700 mb-2">Draw Complete</h3>
            <p className="text-yellow-600">
              The draw has been completed, but we couldn't find your assignment. Please contact the organizer.
            </p>
          </div>
        )}

        {/* Waiting for Draw Message */}
        {event.status === 'active' && currentParticipant && (
          <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
            <div className="text-4xl mb-2">🎄</div>
            <h3 className="font-bold text-blue-700 mb-2">Waiting for Draw</h3>
            <p className="text-blue-600">
              The organizer will run the draw once everyone is ready. Check back soon!
            </p>
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

      {/* Recreate Event Modal */}
      {showRecreateModal && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-christmas-lg max-w-md w-full p-6 md:p-8">
            <h3 className="text-2xl font-bold text-christmas-red-600 mb-4">
              🎄 Recreate Event for Next Year
            </h3>
            <p className="text-gray-600 mb-6">
              This will create a new event with the same details, but the date will be set to next year. 
              All participants will need to join again.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <p className="text-sm text-gray-700">
                <strong>Event Name:</strong> {event.name} {new Date(event.date).getFullYear() + 1}
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>New Date:</strong> {format(new Date(new Date(event.date).setFullYear(new Date(event.date).getFullYear() + 1)), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRecreateModal(false)}
                disabled={isRecreating}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRecreateEvent}
                disabled={isRecreating}
                className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-semibold hover:bg-christmas-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRecreating ? 'Creating...' : 'Recreate Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Message Modal */}
      {showMessageModal && currentParticipantMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-christmas-lg max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-christmas-red-600">
                💌 Send Anonymous Message
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                }}
                disabled={isSendingMessage}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-christmas-gold-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Sending to:</p>
              <p className="font-bold text-christmas-gold-700">{currentParticipantMatch.name}</p>
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Message <span className="text-christmas-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                placeholder="Write your anonymous message here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-red-500 focus:outline-none transition-colors resize-none"
                disabled={isSendingMessage}
              />
              <p className="mt-2 text-xs text-gray-500">
                Your name will not be revealed to the recipient.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                  setError(null)
                }}
                disabled={isSendingMessage}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageText.trim()}
                className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-semibold hover:bg-christmas-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
