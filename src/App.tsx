import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/features/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import JoinPage from './pages/JoinPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import CreateEventPage from './pages/CreateEventPage'
import EventPage from './pages/EventPage'
import AdminPage from './pages/AdminPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import ResultsPage from './pages/ResultsPage'
import TestAlgorithmPage from './pages/TestAlgorithmPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Event Routes (Public) */}
        <Route
          path="/event/:code"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <EventPage />
            </div>
          }
        />
        
        {/* Protected Organizer Routes */}
        <Route
          path="/event/:code/admin"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            </div>
          }
        />
        <Route
          path="/create"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <ProtectedRoute>
                <OrganizerDashboard />
              </ProtectedRoute>
            </div>
          }
        />
        
        {/* Results */}
        <Route
          path="/results/:code"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <ResultsPage />
            </div>
          }
        />
        
        {/* Test/Dev Routes */}
        <Route
          path="/test"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <TestAlgorithmPage />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
