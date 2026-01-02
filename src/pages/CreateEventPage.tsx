import { Link } from 'react-router-dom'

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🎄 Create Secret Santa Event
          </h1>
          <p className="text-gray-600 mb-8">
            Set up your gift exchange event and invite participants
          </p>

          <form className="space-y-6">
            <div>
              <label htmlFor="eventName" className="block text-sm font-semibold text-gray-700 mb-2">
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                placeholder="e.g., Office Secret Santa 2024"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-red-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Gift Exchange Date
              </label>
              <input
                type="date"
                id="eventDate"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-green-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
                Budget (optional)
              </label>
              <input
                type="text"
                id="budget"
                placeholder="e.g., $25"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-gold-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Add any special instructions or rules..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-christmas-red-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas"
              >
                Create Event
              </button>
              <Link
                to="/"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

