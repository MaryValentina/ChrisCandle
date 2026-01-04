import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Event, Participant, Assignment, EventStatus } from '../types'
import { generateAssignments, ImpossibleAssignmentError } from '../lib/shuffle'
import { saveAssignments, updateEvent as updateEventInFirebase } from '../lib/firebase'

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
  createEvent: (eventData: Omit<Event, 'id' | 'status' | 'createdAt' | 'participants'>) => void
  updateEvent: (updates: Partial<Event>) => void
  resetEvent: () => void
  
  // Participant management
  addParticipant: (participant: Participant) => void
  removeParticipant: (id: string) => void
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  markParticipantReady: (id: string) => void
  markParticipantNotReady: (id: string) => void
  
  // Assignment management
  runDraw: () => Promise<void>
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
  return uuidv4()
}

/**
 * Generate a unique ID for participants
 */
function generateParticipantId(): string {
  return uuidv4()
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
      eventStatus: 'active' as EventStatus,
      canRunDraw: false,
      hasAssignments: false,

      // Event management actions
      createEvent: (eventData) => {
        const newEvent: Event = {
          ...eventData,
          id: generateEventId(),
          code: eventData.code || '', // TODO: Generate code
          status: 'active',
          participants: [],
          createdAt: new Date().toISOString(),
        }
        
        set({
          currentEvent: newEvent,
          assignments: [],
          participants: [],
          eventStatus: 'active',
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
        }

        const participants = updatedEvent.participants || []
        const canRunDraw = 
          participants.length >= 2 &&
          participants.every(p => p.isReady) &&
          updatedEvent.status !== 'drawn' &&
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
          eventStatus: 'active',
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
          currentEvent.status !== 'drawn' &&
          currentEvent.status !== 'completed'

        set({
          currentEvent: {
            ...currentEvent,
            participants: updatedParticipants,
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
          currentEvent.status !== 'drawn' &&
          currentEvent.status !== 'completed'

        set({
          currentEvent: {
            ...currentEvent,
            participants: updatedParticipants,
            exclusions: updatedExclusions,
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
          currentEvent.status !== 'drawn' &&
          currentEvent.status !== 'completed'

        set({
          currentEvent: {
            ...currentEvent,
            participants: updatedParticipants,
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
      runDraw: async () => {
        const state = get()
        const currentEvent = state.currentEvent

        if (!currentEvent) {
          set({ error: 'No event to run draw for' })
          return
        }

        if (!state.canRunDraw) {
          set({ 
            error: 'Cannot run draw: Need at least 2 ready participants and event must not be drawn or completed' 
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

          // Save assignments to Firebase
          try {
            await saveAssignments(currentEvent.id, newAssignments.map(a => ({
              eventId: a.eventId,
              giverId: a.giverId,
              receiverId: a.receiverId,
              createdAt: a.createdAt,
              revealedAt: a.revealedAt,
            })))

            // Update event status in Firebase
            await updateEventInFirebase(currentEvent.id, {
              status: 'drawn',
            })

            console.log('✅ Draw completed and saved to Firebase')
          } catch (firebaseError) {
            console.error('❌ Error saving to Firebase:', firebaseError)
            // Still update local state even if Firebase fails
            // This allows the app to work offline
          }

          // Update local state
          set({
            currentEvent: {
              ...currentEvent,
              status: 'drawn',
            },
            assignments: newAssignments,
            eventStatus: 'drawn',
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
          throw error // Re-throw so caller can handle it
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
              status: 'completed' as EventStatus,
            }
          : currentEvent

        set({
          assignments: updatedAssignments,
          currentEvent: updatedEvent,
          eventStatus: updatedEvent?.status || 'active',
          hasAssignments: updatedAssignments.length > 0,
        })
      },

      clearAssignments: () => {
        const currentEvent = get().currentEvent
        if (!currentEvent) return

        const newStatus: EventStatus = 'active'
        const updatedEvent = {
          ...currentEvent,
          status: newStatus,
        }

        const participants = updatedEvent.participants || []
        const canRunDraw = 
          participants.length >= 2 &&
          participants.every(p => p.isReady) &&
          newStatus === 'active'

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
        // Only persist active events
        currentEvent: 
          state.currentEvent && 
          state.currentEvent.status === 'active'
            ? state.currentEvent
            : null,
        // Don't persist assignments (they should be regenerated)
        assignments: [],
      }),
    }
  )
)

