import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Event } from '../types'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { convertFirestoreEvent } from '../lib/firebase'
import { format } from 'date-fns'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const { organizerId } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (organizerId) {
      fetchEvents(organizerId)
    } else {
      setError('Please sign in to view your events')
      setIsLoading(false)
    }
  }, [organizerId])

  const fetchEvents = async (orgId: string) => {
    try {
      const db = getDb()
      if (!db) {
        throw new Error('Firebase is not configured')
      }

      const eventsRef = collection(db, 'events')
      const q = query(
        eventsRef,
        where('organizerId', '==', orgId),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)

      const fetchedEvents: Event[] = []
      querySnapshot.forEach((doc) => {
        const event = convertFirestoreEvent(doc.data(), doc.id)
        fetchedEvents.push(event)
      })

      setEvents(fetchedEvents)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-christmas-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600">
              🎄 My Events
            </h1>
            <Link
              to="/create"
              className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
            >
              + Create New Event
            </Link>
          </div>
          <p className="text-gray-600">
            Manage your Secret Santa events and view participant activity
          </p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-christmas-lg p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Events Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first Secret Santa event to get started!
            </p>
            <Link
              to="/create"
              className="inline-block px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-christmas-lg p-6 hover:shadow-christmas-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-christmas-red-600 flex-1">
                    {event.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'active'
                        ? 'bg-christmas-green-100 text-christmas-green-700'
                        : event.status === 'drawn'
                        ? 'bg-christmas-red-100 text-christmas-red-700'
                        : event.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">Code:</span>{' '}
                    <span className="font-mono font-bold text-christmas-red-600">
                      {event.code}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span>{' '}
                    {format(new Date(event.date), 'MMM d, yyyy')}
                  </div>
                  <div>
                    <span className="font-semibold">Participants:</span> {event.participants.length}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/event/${event.code}`}
                    className="flex-1 px-4 py-2 bg-christmas-green-500 text-white rounded-lg font-semibold hover:bg-christmas-green-600 transition-colors text-center text-sm"
                  >
                    View Event
                  </Link>
                  <Link
                    to={`/event/${event.code}/admin`}
                    className="flex-1 px-4 py-2 bg-christmas-red-500 text-white rounded-lg font-semibold hover:bg-christmas-red-600 transition-colors text-center text-sm"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

