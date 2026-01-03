import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug: Log loaded env vars (only in dev mode)
  if (mode === 'development') {
    console.log('🔍 Vite loaded environment variables:')
    const firebaseVars = Object.keys(env).filter(k => k.startsWith('VITE_FIREBASE'))
    if (firebaseVars.length > 0) {
      console.log('  ✅ Found Firebase vars:', firebaseVars)
    } else {
      console.log('  ❌ No VITE_FIREBASE variables found')
      console.log('  📁 Current working directory:', process.cwd())
      console.log('  💡 Make sure .env.local exists in project root')
    }
  }

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'utils-vendor': ['date-fns', 'nanoid', 'clsx', 'canvas-confetti'],
          },
        },
      },
      // Increase chunk size warning limit to 600kb (since we're code-splitting now)
      chunkSizeWarningLimit: 600,
    },
  }
})
