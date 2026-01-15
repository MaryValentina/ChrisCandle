/**
 * Firebase Analytics Integration
 * 
 * Provides analytics tracking for key user actions and events.
 * Falls back gracefully if Firebase Analytics is not configured.
 */

import { getAnalytics, logEvent, setUserProperties, type Analytics, isSupported } from 'firebase/analytics'
import { getApp as getFirebaseApp } from 'firebase/app'
import { getFirebaseApp as getAppInstance } from './firebase'

let analyticsInstance: Analytics | null = null
let analyticsInitialized = false
let analyticsInitError: Error | null = null

// Allow disabling Analytics via environment variable
const ANALYTICS_ENABLED = import.meta.env.VITE_ENABLE_ANALYTICS !== 'false'

/**
 * Initialize Firebase Analytics
 * Returns the analytics instance or null if not available
 * 
 * Note: This should be called after Firebase app is initialized.
 * Analytics requires a valid Firebase API key with Analytics API enabled.
 */
export async function initAnalytics(): Promise<Analytics | null> {
  // Check if Analytics is disabled via environment variable
  if (!ANALYTICS_ENABLED) {
    console.log('ℹ️ Firebase Analytics is disabled (VITE_ENABLE_ANALYTICS=false)')
    return null
  }

  // Return cached instance if already initialized
  if (analyticsInstance) {
    return analyticsInstance
  }

  // Return null if we've already tried and failed
  if (analyticsInitError) {
    return null
  }

  try {
    // Check if Analytics is supported in this environment (browser only)
    const supported = await isSupported()
    if (!supported) {
      console.warn('⚠️ Firebase Analytics is not supported in this environment (e.g., SSR, Node.js)')
      analyticsInitError = new Error('Analytics not supported')
      return null
    }

    // Try to get app from our firebase module first, then fallback to firebase/app
    let app = getAppInstance()
    if (!app) {
      // Fallback: try to get from firebase/app directly
      try {
        app = getFirebaseApp()
      } catch (error) {
        console.warn('⚠️ Firebase app not available for Analytics:', error)
        analyticsInitError = error instanceof Error ? error : new Error('Firebase app not available')
        return null
      }
    }
    
    if (!app) {
      console.warn('⚠️ Firebase app is null. Cannot initialize Analytics.')
      analyticsInitError = new Error('Firebase app is null')
      return null
    }

    // Verify app has required config
    const appOptions = app.options
    if (!appOptions.apiKey) {
      console.error('❌ Firebase app missing API key. Analytics cannot be initialized.')
      analyticsInitError = new Error('Firebase API key missing')
      return null
    }

    // Initialize Analytics
    try {
      analyticsInstance = getAnalytics(app)
      analyticsInitialized = true
      console.log('✅ Firebase Analytics initialized successfully')
      return analyticsInstance
    } catch (analyticsError: any) {
      // Handle specific Analytics errors
      const errorMessage = analyticsError?.message || String(analyticsError)
      
      if (errorMessage.includes('API key not valid') || errorMessage.includes('config-fetch-failed')) {
        console.error('❌ Firebase Analytics API key error:', {
          message: errorMessage,
          apiKeyPrefix: appOptions.apiKey?.substring(0, 10) + '...',
          suggestion: 'Check that:\n' +
            '1. VITE_FIREBASE_API_KEY in .env.local matches Firebase Console → Project Settings → General → Web API Key\n' +
            '2. API key restrictions allow Analytics API calls\n' +
            '3. Google Analytics is enabled in Firebase Console → Project Settings → Integrations'
        })
      } else {
        console.error('❌ Firebase Analytics initialization failed:', analyticsError)
      }
      
      analyticsInitError = analyticsError instanceof Error ? analyticsError : new Error(errorMessage)
      return null
    }
  } catch (error) {
    console.warn('⚠️ Analytics initialization error:', error)
    analyticsInitError = error instanceof Error ? error : new Error('Unknown error')
    return null
  }
}

/**
 * Synchronous version for backward compatibility
 * Note: This may return null if Analytics hasn't been initialized yet
 */
export function getAnalyticsInstance(): Analytics | null {
  return analyticsInstance
}

/**
 * Log an analytics event
 * Silently fails if analytics is not available
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  try {
    const analytics = analyticsInstance || getAnalyticsInstance()
    if (analytics) {
      logEvent(analytics, eventName, params)
    }
  } catch (error) {
    // Silently fail - analytics is optional
    console.debug('Analytics tracking failed:', error)
  }
}

/**
 * Set user properties for analytics
 */
export function setAnalyticsUserProperties(properties: Record<string, string>): void {
  try {
    const analytics = analyticsInstance || getAnalyticsInstance()
    if (analytics) {
      setUserProperties(analytics, properties)
    }
  } catch (error) {
    console.debug('Failed to set user properties:', error)
  }
}

// Predefined event names for consistency
export const AnalyticsEvents = {
  // Authentication
  SIGNUP: 'signup',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Events
  EVENT_CREATED: 'event_created',
  EVENT_VIEWED: 'event_viewed',
  EVENT_EXPIRED: 'event_expired',
  EVENT_RECREATED: 'event_recreated',
  
  // Participants
  PARTICIPANT_JOINED: 'participant_joined',
  PARTICIPANT_REENTERED: 'participant_reentered',
  PARTICIPANT_LEFT: 'participant_left',
  
  // Draw
  DRAW_STARTED: 'draw_started',
  DRAW_COMPLETED: 'draw_completed',
  
  // Admin
  EMAIL_RESENT: 'email_resent',
  CSV_EXPORTED: 'csv_exported',
  EVENT_SETTINGS_UPDATED: 'event_settings_updated',
} as const
