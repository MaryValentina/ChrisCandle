import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/features/Navigation'
import LandingPage from './pages/LandingPage'
import JoinPage from './pages/JoinPage'
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
        
        {/* Event Routes */}
        <Route
          path="/event/:code"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <EventPage />
            </div>
          }
        />
        <Route
          path="/event/:code/admin"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <AdminPage />
            </div>
          }
        />
        
        {/* Organizer Routes */}
        <Route
          path="/create"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <CreateEventPage />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <OrganizerDashboard />
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
