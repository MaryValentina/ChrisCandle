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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreateEventPage />} />
          <Route path="/event" element={<EventPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/test" element={<TestAlgorithmPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
