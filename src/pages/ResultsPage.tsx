import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { getEvent, getAssignments, findParticipantByEmail } from '../lib/firebase'
import ResultsCard from '../components/features/ResultsCard'
import ParticipantCard from '../components/features/ParticipantCard'
import CountdownTimer from '../components/CountdownTimer'
import Navbar from '../components/Navbar'
import Snowflakes from '../components/Snowflakes'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import type { Event, Assignment, Participant } from '../types'

export default function ResultsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { organizerId, currentUser } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No event ID provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch event by ID
        const fetchedEvent = await getEvent(id)
        if (!fetchedEvent) {
          setError('Event not found')
          setIsLoading(false)
          return
        }

        setEvent(fetchedEvent)

        // Check if current user is a participant
        // First try by logged-in user email (for organizers who are also participants)
        let participant: Participant | null = null
        if (currentUser?.email && fetchedEvent) {
          try {
            participant = await findParticipantByEmail(fetchedEvent.id, currentUser.email)
          } catch (err) {
            console.warn('Could not find participant by email:', err)
          }
        }
        
        // If not found and no logged-in user, check localStorage (for regular participants)
        if (!participant && fetchedEvent) {
          const storedEmail = localStorage.getItem(`event_${fetchedEvent.id}_email`)
          if (storedEmail) {
            try {
              participant = await findParticipantByEmail(fetchedEvent.id, storedEmail)
            } catch (err) {
              console.warn('Could not find participant by stored email:', err)
            }
          }
        }
        
        setCurrentParticipant(participant || null)

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
  }, [id, currentUser?.email])

  // Get participant by ID
  const getParticipant = (id: string) => {
    return event?.participants.find((p) => p.id === id)
  }

  // Find the current user's match (receiver)
  const getCurrentUserMatch = (): Participant | null => {
    if (!currentParticipant || assignments.length === 0) return null
    
    const userAssignment = assignments.find(a => a.giverId === currentParticipant.id)
    if (!userAssignment) return null
    
    return getParticipant(userAssignment.receiverId) || null
  }

  const currentUserMatch = getCurrentUserMatch()

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
            onClick={() => navigate(`/event/${id}`)}
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
          {/* Event Header */}
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
            <h1 className="font-display text-3xl md:text-4xl text-gradient-gold mb-2">
              🎉 {event.name}
            </h1>
            <p className="text-snow-white/70 mb-6">
              Secret Santa Assignments
            </p>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                <div className="text-sm text-snow-white/60 mb-1">📅 Exchange Date</div>
                <div className="font-bold text-gold">
                  {(() => {
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
              <div className="p-4 bg-christmas-red-dark/30 border border-gold/10 rounded-xl">
                <div className="text-sm text-snow-white/60 mb-1">👥 Participants</div>
                <div className="font-bold text-gold">{event.participants.length}</div>
              </div>
            </div>

            {/* Countdown Timer */}
            {event.status === 'drawn' && (
              <div className="p-4 bg-gold/10 border border-gold/20 rounded-xl">
                <CountdownTimer eventDate={event.date} eventTime={event.time} />
              </div>
            )}
          </div>

          {/* Participants List with Highlighted Match */}
          <div className="bg-christmas-red-dark/40 backdrop-blur-sm border border-gold/20 rounded-2xl shadow-gold p-6 md:p-8 mb-6">
            <h2 className="font-display text-2xl text-gradient-gold mb-4">
              Participants ({event.participants.length})
            </h2>
            {event.participants.length === 0 ? (
              <p className="text-snow-white/70">No participants yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.participants.map((participant) => {
                  const isMatch = currentUserMatch?.id === participant.id
                  return (
                    <div key={participant.id} className={isMatch ? 'relative' : ''}>
                      <ParticipantCard
                        participant={participant}
                        showActions={false}
                        isMatch={isMatch}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* No Assignments Message */}
          {assignments.length === 0 && (
            <div className="mb-6 p-6 bg-gold/10 border-2 border-gold/30 rounded-xl text-center backdrop-blur-sm">
              <div className="text-4xl mb-2">🎁</div>
              <h3 className="font-bold text-gold mb-2">No Assignments Yet</h3>
              <p className="text-snow-white/80">
                The draw hasn't been completed yet. Please wait for the organizer to run the draw.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
