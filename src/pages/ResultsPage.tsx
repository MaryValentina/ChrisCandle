import { Link } from 'react-router-dom'

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🎉 Secret Santa Assignments
          </h1>
          <p className="text-gray-600 mb-8">
            The moment of truth! Here are your Secret Santa pairings.
          </p>

          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-christmas-red-50 to-christmas-green-50 rounded-xl border-2 border-christmas-red-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-lg font-bold text-christmas-red-600 mb-1">
                    🎁 John Doe
                  </div>
                  <div className="text-sm text-gray-600">
                    is buying for
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">→</div>
                  <div className="text-lg font-bold text-christmas-green-600">
                    Jane Smith
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-christmas-green-50 to-christmas-gold-50 rounded-xl border-2 border-christmas-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-lg font-bold text-christmas-green-600 mb-1">
                    🎁 Jane Smith
                  </div>
                  <div className="text-sm text-gray-600">
                    is buying for
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">→</div>
                  <div className="text-lg font-bold text-christmas-gold-600">
                    Bob Johnson
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-christmas-gold-50 to-christmas-red-50 rounded-xl border-2 border-christmas-gold-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-lg font-bold text-christmas-gold-600 mb-1">
                    🎁 Bob Johnson
                  </div>
                  <div className="text-sm text-gray-600">
                    is buying for
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">→</div>
                  <div className="text-lg font-bold text-christmas-red-600">
                    John Doe
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-christmas-green-600 mb-4">
            Share Results
          </h2>
          <p className="text-gray-600 mb-6">
            Send individual assignments to each participant via email
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas">
              Send All Emails
            </button>
            <button className="flex-1 px-6 py-3 bg-christmas-red-500 text-white rounded-xl font-bold hover:bg-christmas-red-600 transition-colors shadow-christmas">
              Export Results
            </button>
            <Link
              to="/"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

