import { Link } from 'react-router-dom'
import { useEventStore } from '../stores/eventStore'
import EventCard from '../components/features/EventCard'
import Snowflakes from '../components/features/Snowflakes'
import '../styles/christmas.css'

export default function LandingPage() {
  const { currentEvent, error } = useEventStore()

  return (
    <div className="christmas-landing">
      {/* Snowflakes Animation */}
      <Snowflakes />

      {/* Decorative elements */}
      <div className="christmas-decoration">🎄</div>
      <div className="christmas-decoration">🎁</div>
      <div className="christmas-decoration">⭐</div>
      <div className="christmas-decoration">❄️</div>

      {/* Content */}
      <div className="christmas-content">
        {/* Elegant Heading */}
        <h1 className="christmas-heading">ChrisCandle</h1>
        <p className="christmas-subtitle">Secret Santa Organizer</p>

        {/* Description */}
        <p className="text-white/90 text-lg md:text-xl mt-6 mb-8 leading-relaxed max-w-2xl mx-auto drop-shadow-lg">
          Organize your Secret Santa gift exchange with friends, family, or coworkers. Create
          events, invite participants, and let the magic happen!
        </p>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-white/90 border-2 border-christmas-red-300 rounded-xl backdrop-blur-sm max-w-md mx-auto">
            <p className="text-christmas-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Current Event Display */}
        {currentEvent && (
          <div className="mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 text-center drop-shadow-md christmas-subtitle">
              Your Current Event
            </h2>
            <EventCard
              event={currentEvent}
              onStartDraw={() => {
                // Navigation handled in EventCard
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/create" className="christmas-button">
            {currentEvent ? 'Create New Event' : 'Create Event'}
          </Link>
          {currentEvent && (
            <Link to="/event" className="christmas-button">
              Manage Event
            </Link>
          )}
          {!currentEvent && (
            <Link to="/event" className="christmas-button">
              Join Event
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white/20 transition-colors border border-white/20">
            <div className="text-4xl mb-3 text-center">🎁</div>
            <h3 className="font-bold text-christmas-gold mb-2 text-center">Easy Setup</h3>
            <p className="text-white/90 text-sm text-center">Create your event in minutes</p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white/20 transition-colors border border-white/20">
            <div className="text-4xl mb-3 text-center">🔒</div>
            <h3 className="font-bold text-christmas-gold mb-2 text-center">Secure</h3>
            <p className="text-white/90 text-sm text-center">Assignments kept secret until reveal</p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white/20 transition-colors border border-white/20">
            <div className="text-4xl mb-3 text-center">📧</div>
            <h3 className="font-bold text-christmas-gold mb-2 text-center">Notifications</h3>
            <p className="text-white/90 text-sm text-center">Automatic email reminders</p>
          </div>
        </div>
      </div>
    </div>
  )
}
