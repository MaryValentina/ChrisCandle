import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Snowflakes from '../components/Snowflakes'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function JoinPage() {
  const navigate = useNavigate()
  const [eventId, setEventId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!eventId.trim()) {
      setError('Please enter an event ID')
      return
    }

    // Redirect to event page with ID
    navigate(`/event/${eventId.trim()}`)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <Snowflakes />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">🎄</div>
      <div className="absolute bottom-20 right-10 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🎁</div>
      
      <Navbar />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 rounded-3xl blur-xl" />
        
        <div className="relative bg-christmas-red-dark/60 backdrop-blur-xl rounded-3xl p-8 border border-gold/20 shadow-gold-lg">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-gradient-gold mb-2">
              🎄 Join Secret Santa
            </h1>
            <p className="text-snow-white/70">
              Enter the event ID from the link shared by your organizer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="eventId" className="block text-sm font-semibold text-snow-white mb-2">
                Event ID <span className="text-gold">*</span>
              </Label>
              <Input
                id="eventId"
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value.trim())}
                placeholder="Enter event ID"
                className={`w-full text-center ${
                  error
                    ? 'border-red-400'
                    : 'border-gold/30 focus:border-gold'
                }`}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-300">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full shadow-gold-lg hover:scale-105 transition-transform"
            >
              Join Event →
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-gold hover:text-gold-light"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

