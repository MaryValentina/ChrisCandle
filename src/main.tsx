import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

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
      <App />
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
