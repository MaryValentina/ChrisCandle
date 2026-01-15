import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { initAnalytics } from './lib/analytics'

// Initialize analytics asynchronously after React mounts
// This ensures Firebase app is ready before Analytics tries to initialize
async function initializeAnalytics() {
  try {
    await initAnalytics()
  } catch (error) {
    // Analytics is optional - app should work without it
    console.debug('Analytics initialization skipped:', error)
  }
}

// Start analytics initialization (don't await - let it run in background)
initializeAnalytics()

console.log("Firebase API Key:", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("SendGrid API Key:", import.meta.env.VITE_SENDGRID_API_KEY);
console.log("SendGrid From Email:", import.meta.env.VITE_SENDGRID_FROM_EMAIL);

// Verify root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found! Make sure index.html has <div id="root"></div>')
}

// Add a test to verify React is mounting
console.log('🚀 React is mounting...')
console.log('Root element:', rootElement)

try {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  )
  console.log('✅ React app rendered successfully!')
} catch (error) {
  console.error('❌ Error rendering React app:', error)
  // Fallback: show error message in the DOM
  rootElement.innerHTML = `
    <div style="padding: 2rem; font-family: sans-serif;">
      <h1 style="color: red;">Error Loading App</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `
  throw error
}
