/**
 * Reminder Scheduling System
 * 
 * This module handles reminder email scheduling for events.
 * In production, reminders would be scheduled via:
 * - Firebase Cloud Functions with Cloud Scheduler
 * - AWS Lambda with EventBridge
 * - A backend cron job
 * 
 * For now, this provides utility functions to calculate reminder dates
 * and a mock scheduling system for development.
 */

import { sendReminderEmail } from './email'
import type { Event } from '../types'

/**
 * Calculate reminder dates for an event
 */
export function calculateReminderDates(eventDate: string | Date): {
  oneWeekBefore: Date
  oneDayBefore: Date
} {
  const date = typeof eventDate === 'string' ? new Date(eventDate) : eventDate
  const oneWeekBefore = new Date(date)
  oneWeekBefore.setDate(date.getDate() - 7)
  
  const oneDayBefore = new Date(date)
  oneDayBefore.setDate(date.getDate() - 1)

  return {
    oneWeekBefore,
    oneDayBefore,
  }
}

/**
 * Check if a reminder should be sent today
 */
export function shouldSendReminder(eventDate: string | Date, reminderType: 'week' | 'day'): boolean {
  const { oneWeekBefore, oneDayBefore } = calculateReminderDates(eventDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reminderType === 'week') {
    const reminderDate = new Date(oneWeekBefore)
    reminderDate.setHours(0, 0, 0, 0)
    return reminderDate.getTime() === today.getTime()
  } else {
    const reminderDate = new Date(oneDayBefore)
    reminderDate.setHours(0, 0, 0, 0)
    return reminderDate.getTime() === today.getTime()
  }
}

/**
 * Send reminder emails to all participants
 * This would typically be called by a scheduled job/cron
 */
export async function sendRemindersToParticipants(
  event: Event,
  reminderType: 'week' | 'day'
): Promise<void> {
  const daysUntil = reminderType === 'week' ? 7 : 1
  const eventLink = `${window.location.origin}/event/${event.id}`

  const emailPromises = event.participants
    .filter((p) => p.email) // Only send to participants with emails
    .map(async (participant) => {
      try {
        const eventDateStr = typeof event.date === 'string' ? event.date : event.date.toISOString()
        await sendReminderEmail({
          participantEmail: participant.email!,
          participantName: participant.name,
          eventName: event.name,
          eventDate: eventDateStr,
          eventLink,
          daysUntil,
        })
      } catch (error) {
        console.warn(`Failed to send reminder to ${participant.email}:`, error)
        // Don't throw - continue with other participants
      }
    })

  await Promise.allSettled(emailPromises)
  console.log(`✅ Reminder emails (${reminderType}) sent for event: ${event.name}`)
}

/**
 * Mock reminder scheduler for development
 * In production, this would be replaced by a Cloud Function or cron job
 * 
 * This function checks all active events and sends reminders if needed
 * Should be called periodically (e.g., daily via cron)
 */
export async function checkAndSendReminders(
  events: Event[]
): Promise<void> {
  const activeEvents = events.filter(
    (e) => e.status === 'active' || e.status === 'drawn'
  )

  for (const event of activeEvents) {
    // Check if 1-week reminder should be sent
    if (shouldSendReminder(event.date, 'week')) {
      console.log(`📧 Sending 1-week reminder for event: ${event.name}`)
      await sendRemindersToParticipants(event, 'week')
    }

    // Check if 1-day reminder should be sent
    if (shouldSendReminder(event.date, 'day')) {
      console.log(`📧 Sending 1-day reminder for event: ${event.name}`)
      await sendRemindersToParticipants(event, 'day')
    }
  }
}

/**
 * Development helper: Manually trigger reminders for testing
 */
export async function sendTestReminders(event: Event): Promise<void> {
  console.log('🧪 Sending test reminders for event:', event.name)
  
  // Send both reminders immediately for testing
  await sendRemindersToParticipants(event, 'week')
  await sendRemindersToParticipants(event, 'day')
}

