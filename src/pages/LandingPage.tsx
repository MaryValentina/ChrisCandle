import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-900 via-christmas-red-800 to-christmas-red-900 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white" style={{
          fontFamily: "'Great Vibes', 'Dancing Script', cursive",
          textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          🎄 ChrisCandle
        </h1>
        <p className="text-2xl md:text-3xl text-white mb-8 font-semibold" style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          Join a Secret Santa with a code
        </p>
        <p className="text-lg md:text-xl text-white/90 mb-10" style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
        }}>
          Organize or join festive gift exchanges with ease
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/join"
            className="px-8 py-4 bg-christmas-green-500 text-white rounded-xl font-bold text-lg hover:bg-christmas-green-600 transition-all shadow-christmas-lg transform hover:scale-105"
          >
            🎁 Join Event
          </Link>
          <Link
            to="/create"
            className="px-8 py-4 bg-christmas-gold-500 text-white rounded-xl font-bold text-lg hover:bg-christmas-gold-600 transition-all shadow-christmas-lg transform hover:scale-105"
          >
            ✨ Organize Event
          </Link>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-4xl w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-white/20">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center" style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-5xl mb-4">1️⃣</div>
            <h3 className="text-xl font-bold text-white mb-2">Get a Code</h3>
            <p className="text-white/90">
              Receive a unique event code from your organizer
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">2️⃣</div>
            <h3 className="text-xl font-bold text-white mb-2">Join & Add Info</h3>
            <p className="text-white/90">
              Enter the code and add your wishlist
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">3️⃣</div>
            <h3 className="text-xl font-bold text-white mb-2">Get Matched</h3>
            <p className="text-white/90">
              When everyone's ready, the draw happens automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
