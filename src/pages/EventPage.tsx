import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { getEvent, subscribeToEvent, addParticipant, getAssignments, createEvent as createFirebaseEvent, findParticipantByEmail, getDb, updateParticipantWishlist, removeParticipant } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { sendWelcomeEmail, sendOrganizerNotificationEmail } from '../lib/email'
import { useEventStore } from '../stores/eventStore'
import { checkAndExpireEvent, getEventStatusMessage, recreateEventForNextYear } from '../lib/eventExpiry'
import ParticipantCard from '../components/features/ParticipantCard'
import JoinEventModal from '../components/JoinEventModal'
import ReEnterEmailModal from '../components/ReEnterEmailModal'
import ResultsCard from '../components/features/ResultsCard'
import CountdownTimer from '../components/CountdownTimer'
import { trackEvent, AnalyticsEvents } from '../lib/analytics'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Snowflakes from '../components/Snowflakes'
import { Button } from '../components/ui/button'
import type { Participant, Event, Assignment } from '../types'

export default function EventPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { updateEvent: updateEventInStore } = useEventStore()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showReEnterModal, setShowReEnterModal] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isReEntering, setIsReEntering] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null)
  const [reEnterError, setReEnterError] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isRecreating, setIsRecreating] = useState(false)
  const [showRecreateModal, setShowRecreateModal] = useState(false)
  const [showEditWishlistModal, setShowEditWishlistModal] = useState(false)
  const [showLeaveEventModal, setShowLeaveEventModal] = useState(false)
  const [isEditingWishlist, setIsEditingWishlist] = useState(false)
  const [isLeavingEvent, setIsLeavingEvent] = useState(false)
  const [wishlistText, setWishlistText] = useState('')
  const { organizerId, organizerName, currentUser } = useAuth()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Note: We don't auto-identify participants from localStorage on page load
  // Participants must explicitly join or re-enter their email to be identified
  // This prevents showing welcome messages prematurely

  const handleReEnterEmail = async (email: string) => {
    if (!event) return

    setIsReEntering(true)
    setReEnterError(null)

    try {
      const participant = await findParticipantByEmail(event.id, email)
      if (participant) {
        setCurrentParticipantId(participant.id)
          localStorage.setItem(`participant_${event.id}`, participant.id)
          localStorage.setItem(`event_${event.id}_email`, email)
          if (participant.name) {
            localStorage.setItem(`participant_name_${event.id}`, participant.name)
          }
          setShowReEnterModal(false)
          setJoinSuccess(true) // Show welcome message
          
          // Track re-entry
          trackEvent(AnalyticsEvents.PARTICIPANT_REENTERED, {
            event_id: event.id,
          })
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setJoinSuccess(false)
          }, 5000)
      } else {
        setReEnterError('No participant found with this email address. Please check your email and try again, or join the event if you haven\'t already.')
      }
    } catch (err) {
      console.error('Error finding participant:', err)
      setReEnterError(err instanceof Error ? err.message : 'Failed to find participant. Please try again.')
    } finally {
      setIsReEntering(false)
    }
  }

  // Fetch event and set up real-time subscription
  useEffect(() => {
    if (!id) {
      setError('No event ID provided')
      setIsLoading(false)
      return
    }

    const fetchAndSubscribe = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initial fetch by ID
        const fetchedEvent = await getEvent(id)
        if (!fetchedEvent) {
          setError('Event not found. Please check the link and try again.')
          setIsLoading(false)
          return
        }

        // Track event view
        trackEvent(AnalyticsEvents.EVENT_VIEWED, {
          event_id: fetchedEvent.id,
        })

        // Check and expire event if needed (if date passed > 7 days)
        try {
          const wasExpired = await checkAndExpireEvent(fetchedEvent)
          if (wasExpired) {
            // Refetch to get updated status
            const updatedEvent = await getEvent(id)
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
            // Check current assignments state using a ref to avoid stale closure
            if (updatedEvent.status === 'drawn') {
              setAssignments((currentAssignments) => {
                // Only fetch if we don't have assignments yet
                if (currentAssignments.length === 0) {
                  setIsLoadingAssignments(true)
                  getAssignments(updatedEvent.id)
                    .then((fetchedAssignments) => {
                      setAssignments(fetchedAssignments)
                    })
                    .catch((err) => {
                      console.error('Error fetching assignments:', err)
                    })
                    .finally(() => {
                      setIsLoadingAssignments(false)
                    })
                }
                return currentAssignments
              })
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
  }, [id, updateEventInStore])

  const handleJoinEvent = async (formData: { name: string; email: string; wishlist?: string[] }) => {
    if (!event) return

    setIsJoining(true)
    setError(null)
    setJoinSuccess(false)

    try {
      const now = new Date().toISOString()
      const newParticipant: Omit<Participant, 'id'> = {
        eventId: event.id,
        name: formData.name,
        email: formData.email,
        wishlist: formData.wishlist,
        isReady: true, // Participants are automatically ready when they join
        joinedAt: now,
      }

      // Save participant to Firestore (addParticipant expects ParticipantData which omits id)
      await addParticipant(event.id, {
        eventId: newParticipant.eventId,
        name: newParticipant.name,
        email: newParticipant.email,
        wishlist: newParticipant.wishlist,
        isReady: true, // Participants are automatically ready when they join
        joinedAt: newParticipant.joinedAt,
      })

      // Get updated event to find the new participant ID
      const updatedEvent = await getEvent(event.id)
      if (updatedEvent) {
        const newParticipantObj = updatedEvent.participants.find(
          (p) => p.name === formData.name && p.email === formData.email
        )
        if (newParticipantObj) {
          setCurrentParticipantId(newParticipantObj.id)
          
          // Store participant info in localStorage for return visits (using email as primary key)
          localStorage.setItem(`participant_${event.id}`, newParticipantObj.id)
          localStorage.setItem(`event_${event.id}_email`, formData.email)
          localStorage.setItem(`participant_name_${event.id}`, formData.name)
        }
        setEvent(updatedEvent)
      }

      // Send success email to participant
      try {
        const eventLink = `${window.location.origin}/event/${event.id}`
        const eventDateStr = typeof event.date === 'string' ? event.date : event.date.toISOString()
        
        // Format time from HH:mm to 12-hour format
        const formatTime = (timeString: string): string => {
          if (!timeString) return ''
          const [hours, minutes] = timeString.split(':').map(Number)
          const period = hours >= 12 ? 'PM' : 'AM'
          const displayHours = hours % 12 || 12
          const displayMinutes = minutes.toString().padStart(2, '0')
          return `${displayHours}:${displayMinutes} ${period}`
        }
        
        await sendWelcomeEmail({
          participantEmail: formData.email,
          participantName: formData.name,
          eventName: event.name,
          eventDate: eventDateStr,
          eventTime: formatTime(event.time || ''),
          eventVenue: event.venue || '',
          eventLink,
        })
      } catch (emailError) {
        // Don't fail the join if email fails
        console.warn('Failed to send welcome email:', emailError)
      }

      // Send notification email to organizer
      try {
        const db = getDb()
        if (db && event.organizerId) {
          // Get organizer info from Firestore
          const organizerDocRef = doc(db, 'users', event.organizerId)
          const organizerDoc = await getDoc(organizerDocRef)
          
          if (organizerDoc.exists()) {
            const organizerData = organizerDoc.data()
            const organizerEmail = organizerData?.email
            const organizerName = organizerData?.name || null
            
            if (organizerEmail) {
              const eventLink = `${window.location.origin}/event/${event.id}/admin`
              const totalParticipants = updatedEvent?.participants.length || event.participants.length + 1
              
              await sendOrganizerNotificationEmail({
                organizerEmail,
                organizerName,
                participantName: formData.name,
                participantEmail: formData.email,
                eventName: event.name,
                totalParticipants,
                eventLink,
              })
            }
          }
        }
      } catch (emailError) {
        // Don't fail the join if organizer notification email fails
        console.warn('Failed to send organizer notification email:', emailError)
      }

      // Show success message
      setJoinSuccess(true)
      setShowJoinModal(false)

      // Track participant joined
      trackEvent(AnalyticsEvents.PARTICIPANT_JOINED, {
        event_id: event.id,
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setJoinSuccess(false)
      }, 5000)
    } catch (err) {
      console.error('Error joining event:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to join event'
      // Check if it's a duplicate email error
      if (errorMessage.includes('already registered')) {
        setError(errorMessage)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsJoining(false)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <Navbar />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-snow-white">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <Navbar />
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-8 text-center max-w-md relative z-10">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl text-gold mb-4">
            {error || 'Event Not Found'}
          </h2>
          <p className="text-snow-white/70 mb-6">
            {error || 'The event you\'re looking for doesn\'t exist.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/join')}
              variant="hero"
              className="shadow-gold"
            >
              Try Another Event
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              Go Home
            </Button>
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
      await recreateEventForNextYear(event, async (eventData) => {
        // Pass organizer info so they're automatically added as participant
        return await createFirebaseEvent(
          eventData,
          currentUser?.email || undefined,
          organizerName || currentUser?.displayName || undefined
        )
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

  const handleEditWishlist = async () => {
    if (!event || !currentParticipantId) return

    setIsEditingWishlist(true)
    try {
      // Split wishlist by newlines or commas
      const wishlistItems = wishlistText
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      await updateParticipantWishlist(event.id, currentParticipantId, wishlistItems)
      
      // Refresh event data
      if (event) {
        const updatedEvent = await getEvent(event.id)
        if (updatedEvent) {
          setEvent(updatedEvent)
        }
      }
      
      setShowEditWishlistModal(false)
      setWishlistText('')
      setError(null)
    } catch (err) {
      console.error('Error updating wishlist:', err)
      setError(err instanceof Error ? err.message : 'Failed to update wishlist')
    } finally {
      setIsEditingWishlist(false)
    }
  }

  const handleLeaveEvent = async () => {
    if (!event || !currentParticipantId) return

    setIsLeavingEvent(true)
    try {
      await removeParticipant(event.id, currentParticipantId)
      
      // Clear localStorage (using event ID)
      localStorage.removeItem(`event_${event.id}_email`)
      localStorage.removeItem(`participant_${event.id}`)
      localStorage.removeItem(`participant_name_${event.id}`)
      
      // Clear current participant
      setCurrentParticipantId(null)
      
      // Refresh event data
      if (event) {
        const updatedEvent = await getEvent(event.id)
        if (updatedEvent) {
          setEvent(updatedEvent)
        }
      }
      
      setShowLeaveEventModal(false)
      setError(null)
      
      // Track analytics
      trackEvent(AnalyticsEvents.PARTICIPANT_LEFT, {
        event_id: event.id,
      })
    } catch (err) {
      console.error('Error leaving event:', err)
      setError(err instanceof Error ? err.message : 'Failed to leave event')
    } finally {
      setIsLeavingEvent(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowflakes />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">🎄</div>
      <div className="absolute top-40 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎁</div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="text-gold hover:text-gold-light mb-4"
            >
              ← Back to Home
            </Button>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-display text-4xl md:text-5xl text-gradient-gold mb-2">
                  🎄 {event.name}
                </h1>
              </div>
              {isOrganizer && (
                <Button
                  onClick={() => navigate(`/event/${event.id}/admin`)}
                  variant="hero"
                  size="sm"
                  className="shadow-gold"
                >
                  🔒 Admin
                </Button>
              )}
            </div>
          </div>

          {/* Event Expired/Completed Banner */}
          {(event.status === 'expired' || event.status === 'completed') && (
            <div className={`mb-6 p-6 rounded-2xl border-2 ${
              event.status === 'expired'
                ? 'bg-christmas-red-dark/40 border-red-400/30 backdrop-blur-sm'
                : 'bg-christmas-red-dark/40 border-gold/30 backdrop-blur-sm'
            }`}>
              <div className="text-center">
                <div className="text-5xl mb-4">
                  {event.status === 'expired' ? '⏰' : '✅'}
                </div>
                <h2 className={`font-display text-2xl mb-2 ${
                  event.status === 'expired'
                    ? 'text-red-300'
                    : 'text-gold'
                }`}>
                  Event Completed
                </h2>
                <p className={`mb-4 text-snow-white/70 ${
                  event.status === 'expired'
                    ? 'text-red-200'
                    : 'text-gold/80'
                }`}>
                  {statusMessage?.message || 'This event has ended.'}
                </p>
                {statusMessage?.canRecreate && isOrganizer && (
                  <Button
                    onClick={() => setShowRecreateModal(true)}
                    variant="hero"
                    className="shadow-gold"
                  >
                    🎄 Recreate for Next Year
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Event Status Message (for active events) */}
          {event.status !== 'expired' && event.status !== 'completed' && statusMessage && (
            <div className={`mb-6 p-4 rounded-xl border-2 backdrop-blur-sm ${
              statusMessage.type === 'warning'
                ? 'bg-gold/20 border-gold/40'
                : 'bg-gold/10 border-gold/30'
            }`}>
              <p className={`text-center ${
                statusMessage.type === 'warning'
                  ? 'text-gold'
                  : 'text-snow-white/90'
              }`}>
                {statusMessage.message}
              </p>
            </div>
          )}

          {/* Event Details */}
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
            <h2 className="font-display text-2xl text-gradient-gold mb-4">Event Details</h2>
            
            {/* Countdown Timer */}
            {event.status === 'active' && (
              <div className="mb-6 p-4 bg-gold/10 border border-gold/20 rounded-xl">
                <CountdownTimer eventDate={event.date} eventTime={event.time} />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                <div className="text-sm text-snow-white/60 mb-1">📅 Exchange Date</div>
                <div className="font-bold text-gold">
                  {(() => {
                    // Handle YYYY-MM-DD format strings correctly
                    if (typeof event.date === 'string' && event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      const [year, month, day] = event.date.split('-').map(Number)
                      const date = new Date(year, month - 1, day)
                      return format(date, 'MMM d, yyyy')
                    }
                    return format(new Date(event.date), 'MMM d, yyyy')
                  })()}
                </div>
              </div>
              {event.time && (
                <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                  <div className="text-sm text-snow-white/60 mb-1">🕒 Time</div>
                  <div className="font-bold text-gold">
                    {(() => {
                      // Convert HH:mm to 12-hour format
                      const [hours, minutes] = event.time.split(':').map(Number)
                      const period = hours >= 12 ? 'PM' : 'AM'
                      const displayHours = hours % 12 || 12
                      const displayMinutes = minutes.toString().padStart(2, '0')
                      return `${displayHours}:${displayMinutes} ${period}`
                    })()}
                  </div>
                </div>
              )}
              {event.venue && (
                <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                  <div className="text-sm text-snow-white/60 mb-1">📍 Venue</div>
                  <div className="font-bold text-gold">{event.venue}</div>
                </div>
              )}
              {event.budget && (
                <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                  <div className="text-sm text-snow-white/60 mb-1">💰 Budget</div>
                  <div className="font-bold text-gold">
                    {event.budgetCurrency || 'USD'} {event.budget}
                  </div>
                </div>
              )}
              <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                <div className="text-sm text-snow-white/60 mb-1">👥 Participants</div>
                <div className="font-bold text-gold">{event.participants.length}</div>
              </div>
            </div>
            {event.description && (
              <div className="mt-4 p-4 bg-christmas-red-dark/20 border border-gold/10 rounded-xl">
                <p className="text-snow-white/80">{event.description}</p>
              </div>
            )}
          </div>

          {/* Success Message */}
          {joinSuccess && currentParticipant && (
            <div className="mb-6 p-4 bg-gold/20 border-2 border-gold/40 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✅</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gold mb-1">Welcome{currentParticipant.name ? `, ${currentParticipant.name}` : ''}!</h3>
                  <p className="text-sm text-snow-white/80">
                    Check your email for confirmation. You've successfully joined this Secret Santa event.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Join/Status Section - Disabled if event is expired, completed, or drawn */}
          {event.status === 'expired' || event.status === 'completed' ? (
            <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="font-display text-2xl text-gold mb-4">
                  Event Closed
                </h2>
                <p className="text-snow-white/70 mb-6">
                  This event is no longer accepting new participants.
                </p>
              </div>
            </div>
          ) : event.status === 'drawn' && !currentParticipant ? (
            <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🎁</div>
                <h2 className="font-display text-2xl text-gradient-gold mb-4">
                  Draw Complete
                </h2>
                <p className="text-snow-white/70 mb-6">
                  The Secret Santa draw has been completed. If you were a participant, you can view your match by re-entering your email.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setShowReEnterModal(true)}
                    variant="outline"
                    size="lg"
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Re-enter Email to View Match
                  </Button>
                </div>
              </div>
            </div>
          ) : !currentParticipant ? (
            <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
              <div className="text-center">
                <h2 className="font-display text-2xl text-gradient-gold mb-4">
                  Join This Event
                </h2>
                <p className="text-snow-white/70 mb-6">
                  Add your name, email, and wishlist to participate in this Secret Santa
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setShowJoinModal(true)}
                    variant="hero"
                    size="lg"
                    className="shadow-gold-lg hover:scale-105 transition-transform"
                  >
                    Join Event
                  </Button>
                  <Button
                    onClick={() => setShowReEnterModal(true)}
                    variant="outline"
                    size="lg"
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Already Joined? Re-enter Email
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-display text-2xl text-gradient-gold mb-2">
                  Welcome{currentParticipant.name ? `, ${currentParticipant.name}` : ''}!
                </h2>
                <p className="text-snow-white/70 mb-6">
                  You've joined this Secret Santa event
                </p>
                {currentParticipant.wishlist && currentParticipant.wishlist.length > 0 && (
                  <div className="mt-6 p-4 bg-gold/10 border border-gold/20 rounded-xl">
                    <h3 className="font-bold text-gold mb-2">Your Wishlist:</h3>
                    <ul className="list-disc list-inside text-left text-snow-white/80">
                      {currentParticipant.wishlist.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Edit Wishlist and Leave Event buttons - only show if event hasn't been drawn */}
                {event.status === 'active' && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => {
                        setWishlistText(currentParticipant.wishlist?.join('\n') || '')
                        setShowEditWishlistModal(true)
                      }}
                      variant="outline"
                      className="flex-1 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                    >
                      ✏️ Edit Wishlist
                    </Button>
                    <Button
                      onClick={() => setShowLeaveEventModal(true)}
                      variant="outline"
                      className="flex-1 bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                    >
                      🚪 Leave Event
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Your Match Section - Only shown if event is drawn and participant has an assignment */}
          {event.status === 'drawn' && currentParticipant && currentParticipantAssignment && currentParticipantMatch && (
            <div className="mb-6">
              {isLoadingAssignments ? (
                <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                  <p className="text-snow-white/70">Loading your match...</p>
                </div>
              ) : (
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-gradient-gold mb-4 text-center">
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
            <div className="mb-6 p-6 bg-gold/20 border-2 border-gold/40 rounded-xl text-center backdrop-blur-sm">
              <div className="text-4xl mb-2">⏳</div>
              <h3 className="font-bold text-gold mb-2">Draw Complete</h3>
              <p className="text-snow-white/80">
                The draw has been completed, but we couldn't find your assignment. Please contact the organizer.
              </p>
            </div>
          )}

          {/* Waiting for Draw Message */}
          {event.status === 'active' && currentParticipant && (
            <div className="mb-6 p-6 bg-gold/10 border-2 border-gold/30 rounded-xl text-center backdrop-blur-sm">
              <div className="text-4xl mb-2">🎄</div>
              <h3 className="font-bold text-gold mb-2">Waiting for Draw</h3>
              <p className="text-snow-white/80">
                The organizer will run the draw once everyone is ready. Check back soon!
              </p>
            </div>
          )}

          {/* Participants List */}
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8">
            <h2 className="font-display text-2xl text-gradient-gold mb-4">
              Participants ({event.participants.length})
            </h2>
            {event.participants.length === 0 ? (
              <p className="text-snow-white/70">No participants yet. Be the first to join!</p>
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
      </main>

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

      {/* Re-enter Email Modal */}
      <ReEnterEmailModal
        isOpen={showReEnterModal}
        onClose={() => {
          setShowReEnterModal(false)
          setReEnterError(null)
        }}
        onSubmit={handleReEnterEmail}
        isSubmitting={isReEntering}
        error={reEnterError}
        isOrganizer={false}
      />

      {/* Edit Wishlist Modal */}
      {showEditWishlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-gold-lg max-w-md w-full">
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl text-gradient-gold mb-4">Edit Wishlist</h2>
              <p className="text-snow-white/70 mb-4 text-sm">
                Enter your wishlist items, one per line or separated by commas.
              </p>
              
              <textarea
                value={wishlistText}
                onChange={(e) => setWishlistText(e.target.value)}
                placeholder="e.g., Books, Coffee, Art supplies"
                rows={6}
                className="w-full px-4 py-3 border-2 border-gold/30 rounded-xl bg-christmas-red-deep/50 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:outline-none transition-colors resize-none"
                disabled={isEditingWishlist}
              />
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowEditWishlistModal(false)
                    setWishlistText('')
                  }}
                  disabled={isEditingWishlist}
                  variant="outline"
                  className="flex-1 bg-christmas-red-dark/30 border-gold/30 text-snow-white hover:bg-christmas-red-dark/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditWishlist}
                  disabled={isEditingWishlist}
                  variant="hero"
                  className="flex-1 shadow-gold"
                >
                  {isEditingWishlist ? 'Saving...' : 'Save Wishlist'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Event Modal */}
      {showLeaveEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-destructive/30 rounded-2xl shadow-gold-lg max-w-md w-full">
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl text-destructive mb-4">Leave Event</h2>
              <p className="text-snow-white/70 mb-6">
                Are you sure you want to leave this event? This action cannot be undone. You will need to rejoin with your email if you want to participate again.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowLeaveEventModal(false)}
                  disabled={isLeavingEvent}
                  variant="outline"
                  className="flex-1 bg-christmas-red-dark/30 border-gold/30 text-snow-white hover:bg-christmas-red-dark/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLeaveEvent}
                  disabled={isLeavingEvent}
                  variant="destructive"
                  className="flex-1"
                >
                  {isLeavingEvent ? 'Leaving...' : 'Leave Event'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recreate Event Modal */}
      {showRecreateModal && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-gold-lg max-w-md w-full p-6 md:p-8">
            <h3 className="font-display text-2xl text-gradient-gold mb-4">
              🎄 Recreate Event for Next Year
            </h3>
            <p className="text-snow-white/80 mb-6">
              This will create a new event with the same details, but the date will be set to next year. 
              All participants will need to join again.
            </p>
            <div className="bg-christmas-red-dark/50 border border-gold/20 p-4 rounded-xl mb-6">
              <p className="text-sm text-snow-white/90">
                <strong className="text-gold">Event Name:</strong> {event.name} {new Date(event.date).getFullYear() + 1}
              </p>
              <p className="text-sm text-snow-white/90 mt-2">
                <strong className="text-gold">New Date:</strong> {format(new Date(new Date(event.date).setFullYear(new Date(event.date).getFullYear() + 1)), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowRecreateModal(false)}
                disabled={isRecreating}
                variant="outline"
                className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecreateEvent}
                disabled={isRecreating}
                variant="hero"
                className="flex-1 shadow-gold"
              >
                {isRecreating ? 'Creating...' : 'Recreate Event'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Message Modal */}
      {showMessageModal && currentParticipantMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-christmas-red-dark/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-gold-lg max-w-md w-full p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-gradient-gold">
                💌 Send Anonymous Message
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                }}
                disabled={isSendingMessage}
                className="text-gold/60 hover:text-gold transition-colors"
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

            <div className="mb-4 p-4 bg-gold/10 border border-gold/20 rounded-xl">
              <p className="text-sm text-snow-white/60 mb-2">Sending to:</p>
              <p className="font-bold text-gold">{currentParticipantMatch.name}</p>
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-semibold text-snow-white mb-2">
                Your Message <span className="text-gold">*</span>
              </label>
              <textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                placeholder="Write your anonymous message here..."
                className="w-full px-4 py-3 border-2 border-gold/30 rounded-xl bg-christmas-red-dark/50 text-snow-white placeholder:text-snow-white/40 focus:border-gold focus:outline-none transition-colors resize-none"
                disabled={isSendingMessage}
              />
              <p className="mt-2 text-xs text-snow-white/60">
                Your name will not be revealed to the recipient.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                  setError(null)
                }}
                disabled={isSendingMessage}
                variant="outline"
                className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageText.trim()}
                variant="hero"
                className="flex-1 shadow-gold"
              >
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
