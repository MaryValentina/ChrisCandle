import { Link } from 'react-router-dom'

export default function EventPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🎁 Secret Santa Event
          </h1>
          <p className="text-gray-600 mb-6">
            Manage your event and participants
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-christmas-red-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-red-600">12</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="p-4 bg-christmas-green-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-green-600">Dec 25</div>
              <div className="text-sm text-gray-600">Exchange Date</div>
            </div>
            <div className="p-4 bg-christmas-gold-50 rounded-xl">
              <div className="text-2xl font-bold text-christmas-gold-600">$25</div>
              <div className="text-sm text-gray-600">Budget</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-christmas-green-600 mb-4">
            Participants
          </h2>
          <div className="space-y-3">
            <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-christmas-green-300 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">John Doe</div>
                  <div className="text-sm text-gray-500">john@example.com</div>
                </div>
                <button className="px-4 py-2 bg-christmas-red-500 text-white rounded-lg hover:bg-christmas-red-600 transition-colors text-sm">
                  Remove
                </button>
              </div>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-christmas-green-300 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">Jane Smith</div>
                  <div className="text-sm text-gray-500">jane@example.com</div>
                </div>
                <button className="px-4 py-2 bg-christmas-red-500 text-white rounded-lg hover:bg-christmas-red-600 transition-colors text-sm">
                  Remove
                </button>
              </div>
            </div>
          </div>

          <button className="mt-6 w-full px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas">
            + Add Participant
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-gold-600 mb-4">
            Actions
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas">
              Generate Assignments
            </button>
            <button className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas">
              Send Invitations
            </button>
            <Link
              to="/results"
              className="flex-1 px-6 py-3 bg-christmas-gold-500 text-white rounded-xl font-bold hover:bg-christmas-gold-600 transition-colors shadow-christmas text-center"
            >
              View Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

