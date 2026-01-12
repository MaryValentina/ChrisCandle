import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEventByCode, getAssignments } from '../lib/firebase'
import ResultsCard from '../components/features/ResultsCard'
import Navbar from '../components/Navbar'
import Snowflakes from '../components/Snowflakes'
import { Button } from '../components/ui/button'
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
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <Navbar />
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-8 text-center relative z-10">
          <div className="text-4xl mb-4 animate-bounce">🎄</div>
          <p className="text-xl font-semibold text-gold">Loading assignments...</p>
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
          <h2 className="font-display text-2xl text-gold mb-4">Error</h2>
          <p className="text-snow-white/70 mb-6">{error || 'Event not found'}</p>
          <Button
            onClick={() => navigate('/')}
            variant="hero"
            className="shadow-gold"
          >
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Snowflakes />
        <Navbar />
        <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-8 text-center max-w-md relative z-10">
          <h2 className="font-display text-2xl text-gradient-gold mb-4">
            No Assignments Yet
          </h2>
          <p className="text-snow-white/70 mb-6">
            Assignments haven't been generated yet. The organizer needs to run the draw first.
          </p>
          <Button
            onClick={() => navigate(`/event/${code}`)}
            variant="hero"
            className="shadow-gold"
          >
            Go to Event
          </Button>
        </div>
      </div>
    )
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
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
            <h1 className="font-display text-3xl md:text-4xl text-gradient-gold mb-2">
              🎉 Secret Santa Assignments
            </h1>
            <p className="text-snow-white/70 mb-8">
              The moment of truth! Here are your Secret Santa pairings for{' '}
              <span className="font-semibold text-gold">{event.name}</span>.
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
                    className="p-6 bg-christmas-red-dark/30 border border-gold/20 rounded-xl backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gold mb-1">
                          🎁 {giver.name}
                        </div>
                        <div className="text-sm text-snow-white/60">is buying for</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl text-gold">→</div>
                        <div className="text-lg font-bold text-gold">
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
            <h2 className="font-display text-2xl text-gradient-gold mb-4 text-center">
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
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8">
            <h2 className="font-display text-2xl text-gradient-gold mb-4">Actions</h2>
            <p className="text-snow-white/70 mb-6">
              Share the results or manage your event further.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" className="flex-1 shadow-gold">
                Export Results
              </Button>
              <Link
                to={`/event/${code}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold/10">
                  Back to Event
                </Button>
              </Link>
              <Link
                to="/"
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold/10">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
