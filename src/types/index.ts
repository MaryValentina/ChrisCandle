/**
 * Type definitions for ChrisCandle Secret Santa App
 * 
 * This file contains all the core interfaces and types used throughout the application.
 * All types are designed to be Firestore-compatible.
 * 
 * ID-based approach: Events are accessed via their Firestore document ID.
 */

/**
 * Firestore-compatible date type
 * Firestore stores dates as Timestamp, but we can work with ISO strings or Date objects
 */
export type FirestoreDate = string | Date

/**
 * Represents a user (organizer) of Secret Santa events
 * Compatible with Firestore document structure
 */
export interface User {
  /** Unique identifier for the user (Firestore document ID) */
  id: string
  /** Email address (used for authentication and notifications) */
  email: string
  /** Display name of the user */
  name: string
  /** When the user account was created (Firestore timestamp) */
  createdAt: FirestoreDate
}

/**
 * Status of a Secret Santa event
 * Matches the lifecycle: active → drawn → completed | expired
 */
export type EventStatus = 
  | 'active'     // Event is active and open for participants
  | 'drawn'      // Assignments have been generated
  | 'completed'  // Event is complete
  | 'expired'    // Event has expired (past the exchange date)

/**
 * Represents a Secret Santa event
 * Fully compatible with Firestore document structure
 * ID-based: Events are accessed via their Firestore document ID
 */
export interface Event {
  /** Unique identifier for the event (Firestore document ID) */
  id: string
  /** Name of the event */
  name: string
  /** Date of the gift exchange (Firestore-compatible date) */
  date: FirestoreDate
  /** Time of the event (e.g., "6:00 PM") */
  time: string
  /** Venue/location of the event */
  venue: string
  /** Spending limit/budget amount (optional) */
  budget?: number
  /** Currency for the budget (optional, e.g., "USD", "LKR", "EUR") */
  budgetCurrency?: string
  /** ID of the event organizer (references User.id) */
  organizerId: string
  /** List of participants in the event */
  participants: Participant[]
  /** Exclusion pairs: [id1, id2] means id1 cannot be assigned to id2 (and vice versa) */
  exclusions?: string[][]
  /** Current status of the event */
  status: EventStatus
  /** Optional description or instructions */
  description?: string
  /** Custom expiry duration in days (default: 7). Event expires this many days after the event date. */
  expiryDays?: number
  /** When the event was created (Firestore timestamp - required for Firestore) */
  createdAt: FirestoreDate
}

/**
 * Represents a participant in a Secret Santa event.
 * Must match the Participant interface expected by the shuffle algorithm.
 * Compatible with Firestore document structure.
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: string
  /** ID of the event this participant belongs to (references Event.id) */
  eventId: string
  /** Display name of the participant */
  name: string
  /** Email address for notifications */
  email?: string
  /** Wishlist items or preferences */
  wishlist?: string[]
  /** Whether the participant has confirmed they're ready */
  isReady?: boolean
  /** Whether this participant is the event organizer */
  isOrganizer?: boolean
  /** When the participant joined the event (Firestore timestamp) */
  joinedAt: FirestoreDate
  /** Optional: ID of the assignment where this participant is the giver (references Assignment.id) */
  giverOf?: string
  /** Optional: ID of the assignment where this participant is the receiver (references Assignment.id) */
  receiverOf?: string
}

/**
 * Represents a Secret Santa assignment (who gives to whom)
 * Compatible with Firestore document structure
 */
export interface Assignment {
  /** ID of the event this assignment belongs to (references Event.id) */
  eventId: string
  /** ID of the person giving the gift (giver) - references Participant.id */
  giverId: string
  /** ID of the person receiving the gift (receiver) - references Participant.id */
  receiverId: string
  /** When the assignment was revealed to the giver (null if not yet revealed) */
  revealedAt?: FirestoreDate | null
  /** When the assignment was created (Firestore timestamp - required for Firestore) */
  createdAt: FirestoreDate
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
 * Firestore document data type for User (without the document ID)
 * Useful when creating/updating Firestore documents
 */
export type UserData = Omit<User, 'id'>

/**
 * Firestore document data type for Event (without the document ID)
 * Useful when creating/updating Firestore documents
 */
export type EventData = Omit<Event, 'id'>

/**
 * Firestore document data type for Participant (without the document ID)
 * Useful when creating/updating Firestore documents
 */
export type ParticipantData = Omit<Participant, 'id'>

/**
 * Firestore document data type for Assignment (without the document ID)
 * Useful when creating/updating Firestore documents
 */
export type AssignmentData = Omit<Assignment, 'id'>

/**
 * Example user data for testing and development
 */
export const exampleUser: User = {
  id: 'user-1',
  email: 'organizer@example.com',
  name: 'John Organizer',
  createdAt: new Date('2024-11-01').toISOString()
}

/**
 * Example participant data for testing and development
 */
export const exampleParticipants: Participant[] = [
  {
    id: '1',
    eventId: 'event-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    wishlist: ['Books', 'Coffee', 'Art supplies'],
    isReady: true,
    joinedAt: new Date('2024-11-01').toISOString()
  },
  {
    id: '2',
    eventId: 'event-1',
    name: 'Bob Smith',
    email: 'bob@example.com',
    wishlist: ['Video games', 'Headphones'],
    isReady: true,
    joinedAt: new Date('2024-11-01').toISOString()
  },
  {
    id: '3',
    eventId: 'event-1',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    wishlist: ['Board games', 'Puzzles'],
    isReady: false,
    joinedAt: new Date('2024-11-01').toISOString()
  },
  {
    id: '4',
    eventId: 'event-1',
    name: 'Diana Prince',
    email: 'diana@example.com',
    wishlist: ['Fitness gear', 'Yoga mat'],
    isReady: true,
    joinedAt: new Date('2024-11-01').toISOString()
  }
]

/**
 * Example event data for testing and development
 */
export const exampleEvent: Event = {
  id: 'event-1',
  name: 'Office Secret Santa 2024',
  date: new Date('2024-12-25').toISOString(),
  time: '6:00 PM',
  venue: 'Community Center, 123 Main St',
  budget: 25,
  organizerId: 'user-1',
  participants: exampleParticipants,
  exclusions: [
    ['1', '2'], // Alice and Bob are partners, can't get each other
    ['3', '4']  // Charlie and Diana are partners, can't get each other
  ],
  status: 'active',
  description: 'Our annual office Secret Santa exchange. Please keep assignments secret until the reveal party!',
  createdAt: new Date('2024-11-01').toISOString()
}

/**
 * Example assignments for testing and development
 */
export const exampleAssignments: Assignment[] = [
  {
    eventId: 'event-1',
    giverId: '1',
    receiverId: '3',
    createdAt: new Date('2024-11-15').toISOString()
  },
  {
    eventId: 'event-1',
    giverId: '2',
    receiverId: '4',
    createdAt: new Date('2024-11-15').toISOString()
  },
  {
    eventId: 'event-1',
    giverId: '3',
    receiverId: '1',
    createdAt: new Date('2024-11-15').toISOString()
  },
  {
    eventId: 'event-1',
    giverId: '4',
    receiverId: '2',
    createdAt: new Date('2024-11-15').toISOString()
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

// All types are already exported above with their declarations
// No need for duplicate export statements

// Note: Participant interface is compatible with shuffle.ts requirements:
// - id: string (required)
// - name: string (required)
// - email?: string (optional)
// Additional fields (eventId, wishlist, isReady, joinedAt, giverOf, receiverOf) are optional and won't affect shuffle algorithm
