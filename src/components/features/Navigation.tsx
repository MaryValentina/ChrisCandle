import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navigation() {
  const location = useLocation()
  const { currentUser, organizerName, logout, loading } = useAuth()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-christmas border-b-2 border-christmas-red-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎄</span>
            <span className="text-xl font-bold text-christmas-red-600">
              ChrisCandle
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-christmas-red-500 text-white'
                  : 'text-gray-700 hover:bg-christmas-red-50'
              }`}
            >
              Home
            </Link>
            {currentUser && (
              <>
                <Link
                  to="/create"
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isActive('/create')
                      ? 'bg-christmas-green-500 text-white'
                      : 'text-gray-700 hover:bg-christmas-green-50'
                  }`}
                >
                  Create Event
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-christmas-gold-500 text-white'
                      : 'text-gray-700 hover:bg-christmas-gold-50'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
            {!loading && (
              <>
                {currentUser ? (
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isActive('/login')
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isActive('/signup')
                          ? 'bg-christmas-red-500 text-white'
                          : 'text-gray-700 hover:bg-christmas-red-50'
                      }`}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-y-1">
          <Link
            to="/"
            className={`block px-4 py-2 rounded-lg font-semibold ${
              isActive('/')
                ? 'bg-christmas-red-500 text-white'
                : 'text-gray-700 hover:bg-christmas-red-50'
            }`}
          >
            Home
          </Link>
          {!loading && (
            <>
              {currentUser ? (
                <>
                  <Link
                    to="/create"
                    className={`block px-4 py-2 rounded-lg font-semibold ${
                      isActive('/create')
                        ? 'bg-christmas-green-500 text-white'
                        : 'text-gray-700 hover:bg-christmas-green-50'
                    }`}
                  >
                    Create Event
                  </Link>
                  <Link
                    to="/dashboard"
                    className={`block px-4 py-2 rounded-lg font-semibold ${
                      isActive('/dashboard')
                        ? 'bg-christmas-gold-500 text-white'
                        : 'text-gray-700 hover:bg-christmas-gold-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <div className="px-4 py-2 border-t border-gray-200 mt-2">
                    <div className="text-sm text-gray-600 mb-2">
                      {organizerName || currentUser.email}
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-christmas-red-600 font-semibold transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-christmas-red-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-2 rounded-lg font-semibold bg-christmas-green-500 text-white hover:bg-christmas-green-600"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

