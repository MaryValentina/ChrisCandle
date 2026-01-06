import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function JoinPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!code.trim()) {
      setError('Please enter an event code')
      return
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim()
    
    // Redirect to event page with code
    navigate(`/event/${normalizedCode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
              🎄 Join Secret Santa
            </h1>
            <p className="text-gray-600">
              Enter the event code you received from your organizer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                Event Code <span className="text-christmas-red-500">*</span>
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={10}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-center text-2xl font-bold tracking-widest ${
                  error
                    ? 'border-christmas-red-500'
                    : 'border-gray-300 focus:border-christmas-green-500'
                }`}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-christmas-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas"
            >
              Join Event →
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-christmas-red-600 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

