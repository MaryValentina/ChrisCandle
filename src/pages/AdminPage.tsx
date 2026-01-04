import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getEventByCode, subscribeToEvent, updateEvent, saveAssignments } from '../lib/firebase'
import { useEventStore } from '../stores/eventStore'
import { useAuth } from '../contexts/AuthContext'
import { generateAssignments } from '../lib/shuffle'
import { sendDrawEmail } from '../lib/email'
import QRCodeSVG from 'react-qr-code'
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
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
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

      // Send draw completion emails to all participants
      const eventLink = `${window.location.origin}/event/${event.code}`
      const emailPromises = assignments.map(async (assignment) => {
        const giver = event.participants.find((p) => p.id === assignment.giverId)
        const receiver = event.participants.find((p) => p.id === assignment.receiverId)

        if (giver && receiver && giver.email) {
          try {
            await sendDrawEmail({
              participantEmail: giver.email,
              participantName: giver.name,
              receiverName: receiver.name,
              receiverWishlist: receiver.wishlist,
              eventName: event.name,
              eventDate: event.date,
              eventLink,
            })
          } catch (emailError) {
            // Don't fail the draw if email fails
            console.warn(`Failed to send draw email to ${giver.email}:`, emailError)
          }
        }
      })

      // Wait for all emails to be sent (or fail silently)
      await Promise.allSettled(emailPromises)

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

  const shareableLink = event ? `${window.location.origin}/event/${event.code}` : ''

  const handleCopyCode = async () => {
    if (!event) return
    try {
      await navigator.clipboard.writeText(event.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareableLink) return
    try {
      await navigator.clipboard.writeText(shareableLink)
      setShareLinkCopied(true)
      setTimeout(() => setShareLinkCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy share link:', err)
    }
  }

  const handleExtendDate = async () => {
    if (!event || !newDate) return

    setIsUpdating(true)
    try {
      await updateEvent(event.id, { date: newDate })
      setShowDateModal(false)
      setNewDate('')
      setError(null)
    } catch (err) {
      console.error('Error extending date:', err)
      setError(err instanceof Error ? err.message : 'Failed to extend date')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEvent = async () => {
    if (!event) return

    setIsUpdating(true)
    try {
      await updateEvent(event.id, { status: 'expired' })
      setShowCancelModal(false)
      setError(null)
    } catch (err) {
      console.error('Error canceling event:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel event')
    } finally {
      setIsUpdating(false)
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

        {/* Event Stats - Real-time participant count */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-christmas-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Participants</div>
            <div className="text-3xl font-bold text-christmas-green-600">
              {event.participants.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Real-time count</div>
          </div>
          <div className="bg-white rounded-xl shadow-christmas-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Ready</div>
            <div className="text-3xl font-bold text-christmas-gold-600">
              {event.participants.filter((p) => p.isReady).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {event.participants.length > 0
                ? `${Math.round((event.participants.filter((p) => p.isReady).length / event.participants.length) * 100)}% ready`
                : '0% ready'}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-christmas-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="text-xl font-bold text-christmas-red-600 capitalize">
              {event.status}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {event.status === 'active' && 'Open for participants'}
              {event.status === 'drawn' && 'Assignments generated'}
              {event.status === 'completed' && 'Event finished'}
              {event.status === 'expired' && 'Event cancelled'}
            </div>
          </div>
        </div>

        {/* Event Details & Share */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Event Details</h2>
          <div className="space-y-3 mb-6">
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

          {/* Share Buttons */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">Share Event</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyCode}
                className="flex-1 px-4 py-3 bg-christmas-red-50 text-christmas-red-600 rounded-xl font-semibold hover:bg-christmas-red-100 transition-colors border-2 border-christmas-red-200 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    <span>Code Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy Event Code</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCopyShareLink}
                className="flex-1 px-4 py-3 bg-christmas-green-50 text-christmas-green-600 rounded-xl font-semibold hover:bg-christmas-green-100 transition-colors border-2 border-christmas-green-200 flex items-center justify-center gap-2"
              >
                {shareLinkCopied ? (
                  <>
                    <span>✓</span>
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <span>🔗</span>
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>
            </div>
            {shareableLink && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-600 mb-2">Shareable Link:</div>
                <div className="text-sm font-mono text-gray-800 break-all">{shareableLink}</div>
              </div>
            )}
            {event.code && (
              <div className="mt-4 p-4 bg-white border-2 border-gray-200 rounded-xl flex justify-center">
                <QRCodeSVG value={shareableLink} size={150} />
              </div>
            )}
          </div>
        </div>

        {/* Participants List with Emails */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            Participants ({event.participants.length})
          </h2>
          {event.participants.length === 0 ? (
            <p className="text-gray-600">No participants yet.</p>
          ) : (
            <div className="space-y-3">
              {event.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{participant.name}</div>
                    {participant.email ? (
                      <div className="text-sm text-gray-600 mt-1">{participant.email}</div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1">No email provided</div>
                    )}
                    {participant.wishlist && participant.wishlist.length > 0 && (
                      <div className="text-xs text-christmas-gold-600 mt-1">
                        {participant.wishlist.length} wishlist item(s)
                      </div>
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
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Draw Actions</h2>
          <div className="space-y-4">
            {canRunDraw ? (
              <button
                onClick={handleRunDraw}
                disabled={isRunningDraw}
                className="w-full px-6 py-4 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRunningDraw ? 'Running Draw...' : '🎲 Start Draw'}
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

        {/* Event Settings */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Event Settings</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={() => setShowDateModal(true)}
                disabled={isUpdating || event.status === 'drawn' || event.status === 'completed'}
                className="w-full px-6 py-3 bg-christmas-gold-50 text-christmas-gold-700 rounded-xl font-semibold hover:bg-christmas-gold-100 transition-colors border-2 border-christmas-gold-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200"
              >
                📅 Extend Event Date
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Change the gift exchange date (only if draw hasn't been run)
              </p>
            </div>

            <div>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isUpdating || event.status === 'drawn' || event.status === 'completed'}
                className="w-full px-6 py-3 bg-red-50 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-colors border-2 border-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200"
              >
                ❌ Cancel Event
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Cancel this event (only if draw hasn't been run)
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Extend Date Modal */}
        {showDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-christmas-lg max-w-md w-full p-6 md:p-8">
              <h3 className="text-2xl font-bold text-christmas-red-600 mb-4">Extend Event Date</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Exchange Date
                  </label>
                  <input
                    id="newDate"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-gold-500 focus:outline-none transition-colors"
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDateModal(false)
                      setNewDate('')
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtendDate}
                    disabled={isUpdating || !newDate}
                    className="flex-1 px-6 py-3 bg-christmas-gold-500 text-white rounded-xl font-semibold hover:bg-christmas-gold-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Date'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Event Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-christmas-lg max-w-md w-full p-6 md:p-8">
              <h3 className="text-2xl font-bold text-christmas-red-600 mb-4">Cancel Event</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this event? This action cannot be undone. All
                participants will be notified.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Keep Event
                </button>
                <button
                  onClick={handleCancelEvent}
                  disabled={isUpdating}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Canceling...' : 'Cancel Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

