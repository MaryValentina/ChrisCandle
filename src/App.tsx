import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/features/Navigation'
import LandingPage from './pages/LandingPage'
import CreateEventPage from './pages/CreateEventPage'
import EventPage from './pages/EventPage'
import ResultsPage from './pages/ResultsPage'
import TestAlgorithmPage from './pages/TestAlgorithmPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
          path="/event"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <EventPage />
            </div>
          }
        />
        <Route
          path="/results"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <ResultsPage />
            </div>
          }
        />
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
