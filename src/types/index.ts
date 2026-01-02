/**
 * Type definitions for ChrisCandle Secret Santa App
 * 
 * This file contains all the core interfaces and types used throughout the application.
 */

/**
 * Represents a participant in a Secret Santa event.
 * Must match the Participant interface expected by the shuffle algorithm.
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: string
  /** Display name of the participant */
  name: string
  /** Email address for notifications */
  email?: string
  /** Phone number (optional) */
  phone?: string
  /** Wishlist items or preferences */
  wishlist?: string[]
  /** Whether the participant has confirmed they're ready */
  isReady?: boolean
}

/**
 * Status of a Secret Santa event
 */
export type EventStatus = 
  | 'draft'      // Event is being created, not yet active
  | 'open'       // Event is open for participants to join
  | 'closed'     // Registration is closed, assignments can be generated
  | 'assigned'   // Assignments have been generated
  | 'revealed'   // Assignments have been revealed to participants
  | 'completed'  // Event is complete

/**
 * Represents a Secret Santa event
 */
export interface Event {
  /** Unique identifier for the event */
  id: string
  /** Name of the event */
  name: string
  /** Date of the gift exchange */
  date: Date | string
  /** Spending limit/budget (optional) */
  spendingLimit?: number
  /** ID of the event organizer */
  organizerId: string
  /** List of participants in the event */
  participants: Participant[]
  /** Exclusion pairs: [id1, id2] means id1 cannot be assigned to id2 (and vice versa) */
  exclusions?: string[][]
  /** Current status of the event */
  status: EventStatus
  /** Optional description or instructions */
  description?: string
  /** When the event was created */
  createdAt?: Date | string
  /** When the event was last updated */
  updatedAt?: Date | string
}

/**
 * Represents a Secret Santa assignment (who gives to whom)
 */
export interface Assignment {
  /** ID of the event this assignment belongs to */
  eventId: string
  /** ID of the person giving the gift (giver) */
  giverId: string
  /** ID of the person receiving the gift (receiver) */
  receiverId: string
  /** When the assignment was revealed to the giver (null if not yet revealed) */
  revealedAt?: Date | string | null
  /** When the assignment was created */
  createdAt?: Date | string
}

/**
 * Application state for managing current event and UI state
 */
export interface AppState {
  /** Currently selected/active event */
  currentEvent: Event | null
  /** Whether the app is loading data */
  isLoading: boolean
  /** Error message if something went wrong */
  error: string | null
  /** All events the user has access to */
  events?: Event[]
  /** Assignments for the current event */
  assignments?: Assignment[]
}

/**
 * Example participant data for testing and development
 */
export const exampleParticipants: Participant[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1-555-0101',
    wishlist: ['Books', 'Coffee', 'Art supplies'],
    isReady: true
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '+1-555-0102',
    wishlist: ['Video games', 'Headphones'],
    isReady: true
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    phone: '+1-555-0103',
    wishlist: ['Board games', 'Puzzles'],
    isReady: false
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    phone: '+1-555-0104',
    wishlist: ['Fitness gear', 'Yoga mat'],
    isReady: true
  }
]

/**
 * Example event data for testing and development
 */
export const exampleEvent: Event = {
  id: 'event-1',
  name: 'Office Secret Santa 2024',
  date: new Date('2024-12-25'),
  spendingLimit: 25,
  organizerId: '1',
  participants: exampleParticipants,
  exclusions: [
    ['1', '2'], // Alice and Bob are partners, can't get each other
    ['3', '4']  // Charlie and Diana are partners, can't get each other
  ],
  status: 'open',
  description: 'Our annual office Secret Santa exchange. Please keep assignments secret until the reveal party!',
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2024-11-15')
}

/**
 * Example assignments for testing and development
 */
export const exampleAssignments: Assignment[] = [
  {
    eventId: 'event-1',
    giverId: '1',
    receiverId: '3',
    createdAt: new Date('2024-11-15')
  },
  {
    eventId: 'event-1',
    giverId: '2',
    receiverId: '4',
    createdAt: new Date('2024-11-15')
  },
  {
    eventId: 'event-1',
    giverId: '3',
    receiverId: '1',
    createdAt: new Date('2024-11-15')
  },
  {
    eventId: 'event-1',
    giverId: '4',
    receiverId: '2',
    createdAt: new Date('2024-11-15')
  }
]

/**
 * Example app state for testing and development
 */
export const exampleAppState: AppState = {
  currentEvent: exampleEvent,
  isLoading: false,
  error: null,
  events: [exampleEvent],
  assignments: exampleAssignments
}

// Note: Participant interface is compatible with shuffle.ts requirements:
// - id: string (required)
// - name: string (required)
// - email?: string (optional)
// Additional fields (phone, wishlist, isReady) are optional and won't affect shuffle algorithm

