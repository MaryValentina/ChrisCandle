import { useNavigate } from 'react-router-dom'

export default function EventListPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-christmas-lg p-8 text-center max-w-md">
        <div className="text-4xl mb-4">🎄</div>
        <h2 className="text-2xl font-bold text-christmas-red-600 mb-4">
          My Events
        </h2>
        <p className="text-gray-600 mb-6">
          To view an event, use the shareable link you received when creating it.
          <br />
          <br />
          Or create a new event to get started!
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/create')}
            className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
          >
            Create New Event
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

