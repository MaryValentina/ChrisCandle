import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getEventByCode, subscribeToEvent, updateEvent, saveAssignments } from '../lib/firebase'
import { useEventStore } from '../stores/eventStore'
import { useAuth } from '../contexts/AuthContext'
import { generateAssignments } from '../lib/shuffle'
import type { Event } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const { runDraw: runDrawInStore } = useEventStore()
  const { organizerId } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRunningDraw, setIsRunningDraw] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Check if user is organizer
  const isOrganizer = organizerId && event ? event.organizerId === organizerId : false

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

        // Initial fetch
        const fetchedEvent = await getEventByCode(code)
        if (!fetchedEvent) {
          setError('Event not found')
          setIsLoading(false)
          return
        }

        setEvent(fetchedEvent)

        // Set up real-time subscription
        unsubscribeRef.current = subscribeToEvent(fetchedEvent.id, (updatedEvent, err) => {
          if (err) {
            console.error('Real-time subscription error:', err)
            return
          }
          if (updatedEvent) {
            setEvent(updatedEvent)
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
  }, [code])

  const handleRunDraw = async () => {
    if (!event) return

    setIsRunningDraw(true)
    try {
      // Generate assignments
      const assignmentMap = generateAssignments(event.participants, event.exclusions)

      // Convert to Assignment array
      const assignments = Array.from(assignmentMap.entries()).map(([giverId, receiverId]) => ({
        eventId: event.id,
        giverId,
        receiverId,
        createdAt: new Date().toISOString(),
        revealedAt: null,
      }))

      // Save to Firebase
      await saveAssignments(event.id, assignments)
      await updateEvent(event.id, { status: 'drawn' })

      // Update local store
      await runDrawInStore()

      // Navigate to results
      navigate(`/results/${event.code}`)
    } catch (err) {
      console.error('Error running draw:', err)
      setError(err instanceof Error ? err.message : 'Failed to run draw')
    } finally {
      setIsRunningDraw(false)
    }
  }

  const canRunDraw = event
    ? event.participants.length >= 2 &&
      event.participants.every((p) => p.isReady) &&
      event.status !== 'drawn' &&
      event.status !== 'completed' &&
      event.status !== 'expired'
    : false

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
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Check if user is organizer (already checked in ProtectedRoute, but double-check here)
  if (!organizerId || !event || event.organizerId !== organizerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be the event organizer to access this page.
          </p>
          <button
            onClick={() => navigate(`/event/${code}`)}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            View Public Event
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/event/${code}`)}
            className="text-christmas-red-600 hover:text-christmas-red-700 font-semibold mb-4"
          >
            ← Back to Event
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🔒 Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage your Secret Santa event</p>
        </div>

        {/* Event Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-christmas-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Participants</div>
            <div className="text-3xl font-bold text-christmas-green-600">
              {event.participants.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-christmas-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Ready</div>
            <div className="text-3xl font-bold text-christmas-gold-600">
              {event.participants.filter((p) => p.isReady).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-christmas-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="text-xl font-bold text-christmas-red-600 capitalize">
              {event.status}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Event Details</h2>
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Name:</span>{' '}
              <span className="text-gray-900">{event.name}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Code:</span>{' '}
              <span className="font-mono font-bold text-christmas-red-600">{event.code}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Date:</span>{' '}
              <span className="text-gray-900">
                {format(new Date(event.date), 'MMMM d, yyyy')}
              </span>
            </div>
            {event.budget && (
              <div>
                <span className="font-semibold text-gray-700">Budget:</span>{' '}
                <span className="text-gray-900">${event.budget}</span>
              </div>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Participants</h2>
          {event.participants.length === 0 ? (
            <p className="text-gray-600">No participants yet.</p>
          ) : (
            <div className="space-y-3">
              {event.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{participant.name}</div>
                    {participant.email && (
                      <div className="text-sm text-gray-600">{participant.email}</div>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      participant.isReady
                        ? 'bg-christmas-green-100 text-christmas-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {participant.isReady ? '✓ Ready' : 'Not Ready'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Actions</h2>
          <div className="space-y-4">
            {canRunDraw ? (
              <button
                onClick={handleRunDraw}
                disabled={isRunningDraw}
                className="w-full px-6 py-4 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRunningDraw ? 'Running Draw...' : '🎲 Run Secret Santa Draw'}
              </button>
            ) : (
              <div className="p-4 bg-gray-100 rounded-xl text-gray-600">
                {event.participants.length < 2
                  ? 'Need at least 2 participants to run draw'
                  : !event.participants.every((p) => p.isReady)
                  ? 'All participants must be ready'
                  : event.status === 'drawn'
                  ? 'Draw has already been completed'
                  : 'Cannot run draw at this time'}
              </div>
            )}

            {event.status === 'drawn' && (
              <button
                onClick={() => navigate(`/results/${code}`)}
                className="w-full px-6 py-4 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
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

