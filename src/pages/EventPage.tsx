import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { getEvent } from '../lib/firebase'
import { useEventStore } from '../stores/eventStore'
import ParticipantCard from '../components/features/ParticipantCard'
import ParticipantForm from '../components/features/ParticipantForm'
import type { Participant, Event } from '../types'

export default function EventPage() {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const {
    assignments,
    isLoading: storeIsLoading,
    error: storeError,
    runDraw,
    addParticipant: addParticipantToStore,
    removeParticipant,
    markParticipantReady,
    markParticipantNotReady,
    clearError,
    updateEvent: updateEventInStore,
  } = useEventStore()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Calculate canRunDraw based on fetched event
  const canRunDraw = event
    ? event.participants.length >= 2 &&
      event.participants.every((p) => p.isReady) &&
      event.status !== 'drawn' &&
      event.status !== 'completed'
    : false

  // Use ref to track if component is mounted (survives StrictMode remounts)
  const isMountedRef = useRef(true)

  // Fetch event from Firebase when eventId changes
  useEffect(() => {
    // Reset mounted flag when effect runs
    isMountedRef.current = true

    console.log('🔄 EventPage: useEffect triggered, eventId:', eventId, 'pathname:', window.location.pathname)

    const fetchEvent = async () => {
      if (!eventId) {
        console.warn('⚠️ No eventId provided in URL, pathname:', window.location.pathname)
        if (isMountedRef.current) {
          setError('No event ID provided')
          setIsLoading(false)
        }
        return
      }

      console.log('🔄 EventPage: Starting to fetch event:', eventId, 'from URL:', window.location.href)
      if (isMountedRef.current) {
        setIsLoading(true)
        setError(null)
      }

      try {
        const fetchedEvent = await getEvent(eventId)
        console.log('📥 EventPage: Received event from Firebase:', fetchedEvent ? {
          id: fetchedEvent.id,
          name: fetchedEvent.name,
          participantsCount: fetchedEvent.participants.length,
          status: fetchedEvent.status,
        } : 'null')
        
        // Only update state if component is still mounted
        if (!isMountedRef.current) {
          console.warn('⚠️ EventPage: Component unmounted before state update (ignoring)')
          return
        }

        if (fetchedEvent) {
          console.log('🔄 EventPage: Setting event state...')
          setEvent(fetchedEvent)
          console.log('🔄 EventPage: Event state set, updating store...')
          // Also update the store for compatibility
          updateEventInStore(fetchedEvent)
          console.log('✅ EventPage: Event state updated successfully')
        } else {
          console.warn('⚠️ EventPage: Event not found in Firebase')
          if (isMountedRef.current) {
            setError('Event not found')
            setEvent(null)
          }
        }
        
        if (isMountedRef.current) {
          setIsLoading(false)
          console.log('🏁 EventPage: Fetch complete, isLoading set to false')
        }
      } catch (err) {
        console.error('❌ EventPage: Error fetching event:', err)
        if (isMountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load event'
          setError(errorMessage)
          setEvent(null)
          setIsLoading(false)
        }
      }
    }

    fetchEvent()

    // Cleanup function - mark as unmounted but don't cancel fetch
    return () => {
      isMountedRef.current = false
      console.log('🧹 EventPage: Component unmounting (fetch will complete but state won\'t update)')
    }
  }, [eventId, updateEventInStore])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="animate-spin text-4xl mb-4">🎄</div>
          <h2 className="text-2xl font-bold text-christmas-green-600 mb-4">
            Loading Event...
          </h2>
          <p className="text-gray-600">
            Fetching event details from Firebase
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !event) {
    console.log('⚠️ EventPage: Rendering error state', { error, hasEvent: !!event, isLoading, eventId })
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            {error || 'Event Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Event not found'
              ? 'The event you\'re looking for doesn\'t exist or has been deleted.'
              : error === 'No event ID provided'
              ? 'Please provide a valid event ID in the URL.'
              : 'Unable to load event. Please check your connection and try again.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
            >
              Create Event
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

  const handleRunDraw = async () => {
    if (!canRunDraw || !eventId) return

    try {
      await runDraw()
      // Navigate to results page with eventId after successful draw
      navigate(`/results/${eventId}`)
    } catch (error) {
      console.error('Error running draw:', error)
      // Error is already set in the store, so UI will show it
    }
  }

  const handleAddParticipant = async (participantData: Omit<Participant, 'id'>) => {
    if (!eventId) return
    
    const newParticipant: Participant = {
      ...participantData,
      id: uuidv4(),
    }
    
    // Add to store for immediate UI update
    addParticipantToStore(newParticipant)
    
    // Also add to Firebase (this will update the event in Firebase)
    try {
      const { addParticipant: addParticipantToFirebase } = await import('../lib/firebase')
      await addParticipantToFirebase(eventId, participantData)
      
      // Refresh event data from Firebase
      const updatedEvent = await getEvent(eventId)
      if (updatedEvent) {
        setEvent(updatedEvent)
        updateEventInStore(updatedEvent)
      }
    } catch (error) {
      console.error('Failed to add participant to Firebase:', error)
      // Keep the participant in the store even if Firebase fails
    }
    
    setShowAddForm(false)
  }

  const handleToggleReady = (participant: Participant) => {
    if (participant.isReady) {
      markParticipantNotReady(participant.id)
    } else {
      markParticipantReady(participant.id)
    }
  }

  // Debug: Log render state
  console.log('🎨 EventPage RENDER:', {
    isLoading,
    error,
    hasEvent: !!event,
    eventId,
    eventName: event?.name,
    participantsCount: event?.participants?.length,
    eventType: typeof event,
    eventIsNull: event === null,
    eventIsUndefined: event === undefined,
  })

  // Safety check: Ensure event has required properties
  if (event && (!event.name || !Array.isArray(event.participants))) {
    console.error('❌ EventPage: Event has invalid structure:', event)
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            Invalid Event Data
          </h2>
          <p className="text-gray-600 mb-6">
            The event data is missing required fields. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  console.log('✅ EventPage: Rendering event content', {
    eventName: event?.name,
    participantsCount: event?.participants?.length,
    eventId,
    hasEvent: !!event,
    eventObject: event, // Log full event object for debugging
  })

  // Final safety check - ensure event exists before rendering
  if (!event) {
    console.error('❌ EventPage: Event is null at render time despite passing checks')
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            Event Not Loaded
          </h2>
          <p className="text-gray-600 mb-6">
            The event data failed to load. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Debug banner - visible in development */}
        {import.meta.env.DEV && event && (
          <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-300 text-blue-800 text-sm rounded-lg">
            🐛 Debug: Event loaded - <strong>{event.name}</strong> ({event.participants?.length || 0} participants) - Status: {event.status} - ID: {event.id}
          </div>
        )}
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-christmas-red-100 border-2 border-christmas-red-300 rounded-xl flex items-center justify-between">
            <p className="text-christmas-red-700 font-semibold">⚠️ {error}</p>
            <button
              onClick={clearError}
              className="text-christmas-red-700 hover:text-christmas-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Display */}
        {storeError && (
          <div className="mb-6 p-4 bg-christmas-red-100 border-2 border-christmas-red-300 rounded-xl flex items-center justify-between">
            <p className="text-christmas-red-700 font-semibold">⚠️ {storeError}</p>
            <button
              onClick={clearError}
              className="text-christmas-red-700 hover:text-christmas-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Event Header */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🎁 {event.name}
          </h1>
          {event.description && (
            <p className="text-gray-600 mb-6">{event.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-christmas-red-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-red-600">
                {event.participants.length}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="p-4 bg-christmas-green-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-green-600">
                {format(new Date(event.date), 'MMM d')}
              </div>
              <div className="text-sm text-gray-600">Exchange Date</div>
            </div>
            {event.budget && (
              <div className="p-4 bg-christmas-gold-50 rounded-xl">
                <div className="text-2xl font-bold text-christmas-gold-600">
                  ${event.budget}
                </div>
                <div className="text-sm text-gray-600">Budget</div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                event.status === 'active'
                  ? 'bg-christmas-green-100 text-christmas-green-700'
                  : event.status === 'drawn'
                  ? 'bg-christmas-red-100 text-christmas-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              Status: {event.status}
            </span>
          </div>
        </div>

        {/* Participants Section */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-christmas-green-600">
              Participants ({event.participants.length})
            </h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-christmas-green-500 text-white rounded-lg font-semibold hover:bg-christmas-green-600 transition-colors"
              >
                + Add Participant
              </button>
            )}
          </div>

          {/* Add Participant Form */}
          {showAddForm && (
            <div className="mb-6">
              <ParticipantForm
                onSubmit={handleAddParticipant}
                onCancel={() => setShowAddForm(false)}
                submitLabel="Add Participant"
              />
            </div>
          )}

          {/* Participants List */}
          {event.participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No participants yet. Add your first participant!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {event.participants.map((participant) => (
                <div key={participant.id} className="relative">
                  <ParticipantCard
                    participant={participant}
                    onDelete={removeParticipant}
                    showActions={true}
                  />
                  <button
                    onClick={() => handleToggleReady(participant)}
                    className={`mt-2 w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      participant.isReady
                        ? 'bg-christmas-green-100 text-christmas-green-700 hover:bg-christmas-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {participant.isReady ? '✓ Mark as Not Ready' : 'Mark as Ready'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ready Status Summary */}
          {event.participants.length > 0 && (
            <div className="p-4 bg-christmas-green-50 rounded-xl">
              <div className="text-sm font-semibold text-christmas-green-700 mb-1">
                Ready Status:
              </div>
              <div className="text-sm text-gray-600">
                {event.participants.filter((p) => p.isReady).length} of{' '}
                {event.participants.length} participants ready
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-gold-600 mb-4">Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {canRunDraw && !isLoading && (
              <button
                onClick={handleRunDraw}
                className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas"
              >
                🎁 Generate Assignments
              </button>
            )}
            {storeIsLoading && (
              <div className="flex-1 px-6 py-3 bg-christmas-gold-500 text-white rounded-xl font-bold text-center">
                Generating assignments...
              </div>
            )}
            {!canRunDraw && !storeIsLoading && event.participants.length >= 2 && (
              <div className="flex-1 px-6 py-3 bg-gray-300 text-gray-600 rounded-xl font-bold text-center">
                {event.participants.some((p) => !p.isReady)
                  ? 'All participants must be ready'
                  : 'Draw already completed'}
              </div>
            )}
            {!canRunDraw && !storeIsLoading && event.participants.length < 2 && (
              <div className="flex-1 px-6 py-3 bg-gray-300 text-gray-600 rounded-xl font-bold text-center">
                Need at least 2 participants
              </div>
            )}
            {assignments.length > 0 && eventId && (
              <button
                onClick={() => navigate(`/results/${eventId}`)}
                className="flex-1 px-6 py-3 bg-christmas-gold-500 text-white rounded-xl font-bold hover:bg-christmas-gold-600 transition-colors shadow-christmas"
              >
                View Results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
