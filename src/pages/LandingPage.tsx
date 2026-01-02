import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-christmas-red-600 mb-4">
            🎄 ChrisCandle
          </h1>
          <p className="text-xl md:text-2xl text-christmas-green-700 font-semibold">
            Secret Santa Organizer
          </p>
        </div>
        
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Organize your Secret Santa gift exchange with friends, family, or coworkers. 
          Create events, invite participants, and let the magic happen!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/create"
            className="px-8 py-4 bg-christmas-red-500 text-white rounded-xl font-bold text-lg hover:bg-christmas-red-600 transition-colors shadow-christmas"
          >
            Create Event
          </Link>
          <Link
            to="/event"
            className="px-8 py-4 bg-christmas-green-500 text-white rounded-xl font-bold text-lg hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Join Event
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <div className="text-3xl mb-3">🎁</div>
            <h3 className="font-bold text-christmas-red-600 mb-2">Easy Setup</h3>
            <p className="text-gray-600 text-sm">Create your event in minutes</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold text-christmas-green-600 mb-2">Secure</h3>
            <p className="text-gray-600 text-sm">Assignments kept secret until reveal</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-bold text-christmas-gold-600 mb-2">Notifications</h3>
            <p className="text-gray-600 text-sm">Automatic email reminders</p>
          </div>
        </div>
      </div>
    </div>
  )
}

