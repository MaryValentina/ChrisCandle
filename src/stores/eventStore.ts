import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Event, Participant, Assignment, EventStatus } from '../types'
import { generateAssignments, ImpossibleAssignmentError } from '../lib/shuffle'

/**
 * State interface for the event store
 */
interface EventStoreState {
  // Event data
  currentEvent: Event | null
  assignments: Assignment[]
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  
  // Computed getters
  participants: Participant[]
  eventStatus: EventStatus
  canRunDraw: boolean
  hasAssignments: boolean
}

/**
 * Actions interface for the event store
 */
interface EventStoreActions {
  // Event management
  createEvent: (eventData: Omit<Event, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'participants'>) => void
  updateEvent: (updates: Partial<Event>) => void
  resetEvent: () => void
  
  // Participant management
  addParticipant: (participant: Participant) => void
  removeParticipant: (id: string) => void
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  markParticipantReady: (id: string) => void
  markParticipantNotReady: (id: string) => void
  
  // Assignment management
  runDraw: () => void
  revealAssignment: (giverId: string) => void
  clearAssignments: () => void
  
  // Utility
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

/**
 * Combined store type
 */
type EventStore = EventStoreState & EventStoreActions

/**
 * Generate a unique ID for events
 */
function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a unique ID for participants
 */
function generateParticipantId(): string {
  return `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Zustand store for managing Secret Santa event state
 * 
 * Features:
 * - Global state management for events and participants
 * - LocalStorage persistence for draft events
 * - Integration with shuffle algorithm for assignments
 * - Type-safe with full TypeScript support
 */
export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentEvent: null,
      assignments: [],
      isLoading: false,
      error: null,

      // Computed values (accessed via selectors)
      participants: [],
      eventStatus: 'draft' as EventStatus,
      canRunDraw: false,
      hasAssignments: false,

      // Event management actions
      createEvent: (eventData) => {
        const newEvent: Event = {
          ...eventData,
          id: generateEventId(),
          status: 'draft',
          participants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set({
          currentEvent: newEvent,
          assignments: [],
          participants: [],
          eventStatus: 'draft',
          canRunDraw: false,
          hasAssignments: false,
          error: null,
        })
      },

      updateEvent: (updates) => {
        const currentEvent = get().currentEvent
        if (!currentEvent) {
          set({ error: 'No event to update' })
          return
        }

        const updatedEvent = {
          ...currentEvent,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        const participants = updatedEvent.participants || []
        const canRunDraw = 
          participants.length >= 2 &&
          participants.every(p => p.isReady) &&
          updatedEvent.status !== 'assigned' &&
          updatedEvent.status !== 'revealed' &&
          updatedEvent.status !== 'completed'

        set({
          currentEvent: updatedEvent,
          participants,
          eventStatus: updatedEvent.status,
          canRunDraw,
          error: null,
        })
      },

      resetEvent: () => {
        set({
          currentEvent: null,
          assignments: [],
          participants: [],
          eventStatus: 'draft',
          canRunDraw: false,
          hasAssignments: false,
          error: null,
          isLoading: false,
        })
      },

      // Participant management actions
      addParticipant: (participant) => {
        const currentEvent = get().currentEvent
        if (!currentEvent) {
          set({ error: 'No event to add participant to' })
          return
        }

        const newParticipant: Participant = {
          ...participant,
          id: participant.id || generateParticipantId(),
          isReady: participant.isReady ?? false,
        }

        // Check for duplicate IDs
        if (currentEvent.participants.some(p => p.id === newParticipant.id)) {
          set({ error: `Participant with ID ${newParticipant.id} already exists` })
          return
        }

        const updatedParticipants = [...currentEvent.participants, newParticipant]
        const canRunDraw = 
          updatedParticipants.length >= 2 &&
          updatedParticipants.every(p => p.isReady) &&
          currentEvent.status !== 'assigned' &&
          currentEvent.status !== 'revealed' &&
          currentEvent.status !== 'completed'

        set({
          currentEvent: {
            ...currentEvent,
            participants: updatedParticipants,
            updatedAt: new Date().toISOString(),
          },
          participants: updatedParticipants,
          canRunDraw,
          error: null,
        })
      },

      removeParticipant: (id) => {
        const currentEvent = get().currentEvent
        if (!currentEvent) {
          set({ error: 'No event to remove participant from' })
          return
        }

        // Remove from participants
        const updatedParticipants = currentEvent.participants.filter(p => p.id !== id)
        
        // Remove from exclusions
        const updatedExclusions = currentEvent.exclusions?.filter(
          ([id1, id2]) => id1 !== id && id2 !== id
        )

        // Remove assignments involving this participant
        const updatedAssignments = get().assignments.filter(
          a => a.giverId !== id && a.receiverId !== id
        )

        const canRunDraw = 
          updatedParticipants.length >= 2 &&
          updatedParticipants.every(p => p.isReady) &&
          currentEvent.status !== 'assigned' &&
          currentEvent.status !== 'revealed' &&
          currentEvent.status !== 'completed'

        set({
          currentEvent: {
            ...currentEvent,
            participants: updatedParticipants,
            exclusions: updatedExclusions,
            updatedAt: new Date().toISOString(),
          },
          participants: updatedParticipants,
          assignments: updatedAssignments,
          hasAssignments: updatedAssignments.length > 0,
          canRunDraw,
          error: null,
        })
      },

      updateParticipant: (id, updates) => {
        const currentEvent = get().currentEvent
        if (!currentEvent) {
          set({ error: 'No event to update participant in' })
          return
        }

        const updatedParticipants = currentEvent.participants.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )

        const canRunDraw = 
          updatedParticipants.length >= 2 &&
          updatedParticipants.every(p => p.isReady) &&
          currentEvent.status !== 'assigned' &&
          currentEvent.status !== 'revealed' &&
          currentEvent.status !== 'completed'

        set({
          currentEvent: {
            ...currentEvent,
            participants: updatedParticipants,
            updatedAt: new Date().toISOString(),
          },
          participants: updatedParticipants,
          canRunDraw,
          error: null,
        })
      },

      markParticipantReady: (id) => {
        get().updateParticipant(id, { isReady: true })
      },

      markParticipantNotReady: (id) => {
        get().updateParticipant(id, { isReady: false })
      },

      // Assignment management actions
      runDraw: () => {
        const state = get()
        const currentEvent = state.currentEvent

        if (!currentEvent) {
          set({ error: 'No event to run draw for' })
          return
        }

        if (!state.canRunDraw) {
          set({ 
            error: 'Cannot run draw: Need at least 2 ready participants and event must not be assigned' 
          })
          return
        }

        set({ isLoading: true, error: null })

        try {
          // Generate assignments using shuffle algorithm
          const assignmentMap = generateAssignments(
            currentEvent.participants,
            currentEvent.exclusions
          )

          // Convert Map to Assignment array
          const newAssignments: Assignment[] = Array.from(assignmentMap.entries()).map(
            ([giverId, receiverId]) => ({
              eventId: currentEvent.id,
              giverId,
              receiverId,
              createdAt: new Date().toISOString(),
              revealedAt: null,
            })
          )

          set({
            currentEvent: {
              ...currentEvent,
              status: 'assigned',
              updatedAt: new Date().toISOString(),
            },
            assignments: newAssignments,
            eventStatus: 'assigned',
            hasAssignments: true,
            canRunDraw: false,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof ImpossibleAssignmentError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Failed to generate assignments'

          set({
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      revealAssignment: (giverId) => {
        const assignments = get().assignments
        const updatedAssignments = assignments.map(a =>
          a.giverId === giverId
            ? { ...a, revealedAt: new Date().toISOString() }
            : a
        )

        const allRevealed = updatedAssignments.every(a => a.revealedAt !== null)

        const currentEvent = get().currentEvent
        const updatedEvent = allRevealed && currentEvent
          ? {
              ...currentEvent,
              status: 'revealed' as EventStatus,
              updatedAt: new Date().toISOString(),
            }
          : currentEvent

        set({
          assignments: updatedAssignments,
          currentEvent: updatedEvent,
          eventStatus: updatedEvent?.status || 'draft',
          hasAssignments: updatedAssignments.length > 0,
        })
      },

      clearAssignments: () => {
        const currentEvent = get().currentEvent
        if (!currentEvent) return

        const newStatus: EventStatus = currentEvent.status === 'draft' ? 'draft' : 'open'
        const updatedEvent = {
          ...currentEvent,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }

        const participants = updatedEvent.participants || []
        const canRunDraw = 
          participants.length >= 2 &&
          participants.every(p => p.isReady) &&
          (newStatus === 'draft' || newStatus === 'open')

        set({
          assignments: [],
          currentEvent: updatedEvent,
          eventStatus: newStatus,
          hasAssignments: false,
          canRunDraw,
        })
      },

      // Utility actions
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'chriscandle-event-store', // localStorage key
      partialize: (state) => ({
        // Only persist draft and open events
        currentEvent: 
          state.currentEvent && 
          (state.currentEvent.status === 'draft' || state.currentEvent.status === 'open')
            ? state.currentEvent
            : null,
        // Don't persist assignments (they should be regenerated)
        assignments: [],
      }),
    }
  )
)

