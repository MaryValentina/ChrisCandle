import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEventByCode, getAssignments } from '../lib/firebase'
import ResultsCard from '../components/features/ResultsCard'
import type { Event, Assignment } from '../types'

export default function ResultsPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!code) {
        setError('No event code provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch event by code
        const fetchedEvent = await getEventByCode(code)
        if (!fetchedEvent) {
          setError('Event not found')
          setIsLoading(false)
          return
        }

        setEvent(fetchedEvent)

        // Fetch assignments
        const fetchedAssignments = await getAssignments(fetchedEvent.id)
        setAssignments(fetchedAssignments)

        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError(err instanceof Error ? err.message : 'Failed to load results')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [code])

  // Get participant by ID
  const getParticipant = (id: string) => {
    return event?.participants.find((p) => p.id === id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center">
          <div className="text-4xl mb-4 animate-bounce">🎄</div>
          <p className="text-xl font-semibold text-christmas-red-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Event not found'}</p>
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

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
            No Assignments Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Assignments haven't been generated yet. The organizer needs to run the draw first.
          </p>
          <button
            onClick={() => navigate(`/event/${code}`)}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Go to Event
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🎉 Secret Santa Assignments
          </h1>
          <p className="text-gray-600 mb-8">
            The moment of truth! Here are your Secret Santa pairings for{' '}
            <span className="font-semibold">{event.name}</span>.
          </p>

          {/* All Assignments View */}
          <div className="space-y-4 mb-8">
            {assignments.map((assignment) => {
              const giver = getParticipant(assignment.giverId)
              const receiver = getParticipant(assignment.receiverId)

              if (!giver || !receiver) return null

              return (
                <div
                  key={assignment.giverId}
                  className="p-6 bg-gradient-to-r from-christmas-red-50 to-christmas-green-50 rounded-xl border-2 border-christmas-red-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-lg font-bold text-christmas-red-600 mb-1">
                        🎁 {giver.name}
                      </div>
                      <div className="text-sm text-gray-600">is buying for</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">→</div>
                      <div className="text-lg font-bold text-christmas-green-600">
                        {receiver.name}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Individual Reveal Cards */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-christmas-gold-600 mb-4 text-center">
            Your Assignment
          </h2>
          <div className="space-y-6">
            {assignments.map((assignment) => {
              const receiver = getParticipant(assignment.receiverId)
              if (!receiver) return null

              return (
                <ResultsCard
                  key={assignment.giverId}
                  assignment={assignment}
                  receiver={receiver}
                  onSendMessage={() => {
                    // TODO: Implement message functionality
                    console.log('Send message to', receiver.name)
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-green-600 mb-4">Actions</h2>
          <p className="text-gray-600 mb-6">
            Share the results or manage your event further.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas">
              Export Results
            </button>
            <Link
              to={`/event/${code}`}
              className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas text-center"
            >
              Back to Event
            </Link>
            <Link
              to="/"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors text-center"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
