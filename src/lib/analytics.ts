/**
 * Firebase Analytics Integration
 * 
 * Provides analytics tracking for key user actions and events.
 * Falls back gracefully if Firebase Analytics is not configured.
 */

import { getAnalytics, logEvent, setUserProperties, type Analytics } from 'firebase/analytics'
import { getApp as getFirebaseApp } from 'firebase/app'
import { getFirebaseApp as getAppInstance } from './firebase'

let analyticsInstance: Analytics | null = null

/**
 * Initialize Firebase Analytics
 * Returns the analytics instance or null if not available
 */
export function initAnalytics(): Analytics | null {
  try {
    // Try to get app from our firebase module first, then fallback to firebase/app
    let app = getAppInstance()
    if (!app) {
      // Fallback: try to get from firebase/app directly
      try {
        app = getFirebaseApp()
      } catch {
        return null
      }
    }
    if (!app) {
      return null
    }

    if (!analyticsInstance) {
      analyticsInstance = getAnalytics(app)
    }
    return analyticsInstance
  } catch (error) {
    console.warn('Analytics not available:', error)
    return null
  }
}

/**
 * Log an analytics event
 * Silently fails if analytics is not available
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  try {
    const analytics = analyticsInstance || initAnalytics()
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
    const analytics = analyticsInstance || initAnalytics()
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
  
  // Draw
  DRAW_STARTED: 'draw_started',
  DRAW_COMPLETED: 'draw_completed',
  
  // Admin
  EMAIL_RESENT: 'email_resent',
  CSV_EXPORTED: 'csv_exported',
  EVENT_SETTINGS_UPDATED: 'event_settings_updated',
} as const
