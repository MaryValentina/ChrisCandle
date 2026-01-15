import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/features/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import JoinPage from './pages/JoinPage'
import HowItWorksPage from './pages/HowItWorksPage'
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
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Event Routes (Public) */}
        <Route
          path="/event/:id"
          element={<EventPage />}
        />
        
        {/* Protected Organizer Routes */}
        <Route
          path="/event/:id/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
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
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Results */}
        <Route
          path="/results/:id"
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
