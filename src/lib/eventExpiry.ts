/**
 * Event Expiry Management
 * 
 * Handles automatic expiration of events based on their date.
 * Events are marked as 'expired' if the event date has passed by more than 7 days.
 */

import { updateEvent } from './firebase'
import type { Event } from '../types'

/**
 * Calculate days since event date
 */
export function getDaysSinceEventDate(eventDate: string | Date): number {
  const date = typeof eventDate === 'string' ? new Date(eventDate) : eventDate
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if an event should be expired
 * Events are expired if the event date has passed by more than 7 days
 */
export function shouldExpireEvent(event: Event): boolean {
  // Don't expire if already expired, completed, or drawn
  if (event.status === 'expired' || event.status === 'completed') {
    return false
  }

  const daysSince = getDaysSinceEventDate(event.date)
  return daysSince > 7
}

/**
 * Check if an event date has passed (regardless of expiry threshold)
 */
export function isEventDatePassed(eventDate: string | Date): boolean {
  const date = typeof eventDate === 'string' ? new Date(eventDate) : eventDate
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const eventDateOnly = new Date(date)
  eventDateOnly.setHours(0, 0, 0, 0)
  return eventDateOnly.getTime() < now.getTime()
}

/**
 * Get event status message based on expiry
 */
export function getEventStatusMessage(event: Event): {
  message: string
  type: 'info' | 'warning' | 'error'
  canRecreate: boolean
} {
  if (event.status === 'expired') {
    return {
      message: 'This event has expired and is no longer active.',
      type: 'error',
      canRecreate: true,
    }
  }

  if (event.status === 'completed') {
    return {
      message: 'This event has been completed.',
      type: 'info',
      canRecreate: true,
    }
  }

  const daysSince = getDaysSinceEventDate(event.date)
  const isPassed = isEventDatePassed(event.date)

  if (daysSince > 7) {
    return {
      message: `This event ended ${daysSince} days ago. It will be marked as expired.`,
      type: 'warning',
      canRecreate: true,
    }
  }

  if (isPassed && daysSince <= 7) {
    return {
      message: `This event ended ${daysSince} day${daysSince !== 1 ? 's' : ''} ago.`,
      type: 'info',
      canRecreate: false,
    }
  }

  const daysUntil = Math.ceil(
    (new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntil > 0) {
    return {
      message: `This event is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
      type: 'info',
      canRecreate: false,
    }
  }

  return {
    message: 'This event is today!',
    type: 'info',
    canRecreate: false,
  }
}

/**
 * Mark an event as expired in Firebase
 */
export async function expireEvent(event: Event): Promise<void> {
  if (event.status === 'expired' || event.status === 'completed') {
    return // Already expired or completed
  }

  try {
    await updateEvent(event.id, { status: 'expired' })
    console.log(`✅ Event ${event.name} marked as expired`)
  } catch (error) {
    console.error(`❌ Error expiring event ${event.id}:`, error)
    throw error
  }
}

/**
 * Check and expire an event if needed
 * Returns true if event was expired, false otherwise
 */
export async function checkAndExpireEvent(event: Event): Promise<boolean> {
  if (shouldExpireEvent(event)) {
    await expireEvent(event)
    return true
  }
  return false
}

/**
 * Recreate event for next year
 * Creates a new event with the same details but date set to next year
 */
export async function recreateEventForNextYear(
  event: Event,
  createEventFn: (eventData: Omit<import('../types').EventData, 'createdAt'>) => Promise<string>
): Promise<string> {
  const currentDate = new Date(event.date)
  const nextYearDate = new Date(currentDate)
  nextYearDate.setFullYear(currentDate.getFullYear() + 1)

  const newEventData: Omit<import('../types').EventData, 'createdAt'> = {
    code: '', // Will be generated
    name: `${event.name} ${nextYearDate.getFullYear()}`,
    date: nextYearDate.toISOString(),
    budget: event.budget,
    organizerId: event.organizerId,
    participants: [], // Start fresh
    exclusions: event.exclusions,
    description: event.description,
    status: 'active',
  }

  const newEventId = await createEventFn(newEventData)
  console.log(`✅ Recreated event for next year: ${newEventId}`)
  return newEventId
}

/**
 * Batch check and expire multiple events
 * Useful for scheduled jobs or admin functions
 */
export async function checkAndExpireEvents(events: Event[]): Promise<{
  expired: number
  checked: number
}> {
  let expiredCount = 0
  const activeEvents = events.filter(
    (e) => e.status === 'active' || e.status === 'drawn'
  )

  for (const event of activeEvents) {
    try {
      const wasExpired = await checkAndExpireEvent(event)
      if (wasExpired) {
        expiredCount++
      }
    } catch (error) {
      console.error(`Error checking event ${event.id}:`, error)
    }
  }

  return {
    expired: expiredCount,
    checked: activeEvents.length,
  }
}

