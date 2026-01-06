/**
 * Firebase Configuration and Setup
 * 
 * This module initializes Firebase services (Firestore and Authentication)
 * using environment variables for configuration.
 * 
 * Note: Firebase initialization is lazy - it won't block app startup if
 * environment variables are missing. The app will work without Firebase.
 */

import { initializeApp, getApps } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc, 
  collection, 
  addDoc,
  writeBatch,
  query,
  where,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import type { Event, Participant, Assignment, EventData, ParticipantData, AssignmentData, FirestoreDate } from '../types'

/**
 * Firebase configuration interface
 */
interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}

/**
 * Get Firebase configuration from environment variables
 * Returns null if configuration is missing (non-blocking)
 */
function getFirebaseConfig(): FirebaseConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

  // Debug: Log what we're getting (without exposing full values)
  console.log('🔍 Firebase Config Check:')
  console.log('  - API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
  console.log('  - Auth Domain:', authDomain || 'MISSING')
  console.log('  - Project ID:', projectId || 'MISSING')
  console.log('  - All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_FIREBASE')))

  // Return null if config is missing (don't throw - allow app to work without Firebase)
  if (!apiKey || !authDomain || !projectId) {
    console.warn(
      'Firebase configuration is missing. Firebase features will be disabled. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your .env file to enable Firebase.'
    )
    console.warn('💡 TIP: Make sure your .env.local file is in the project root and restart the dev server!')
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
  }
}

/**
 * Initialize Firebase app (singleton pattern)
 * Returns null if configuration is missing (non-blocking)
 */
let firebaseApp: FirebaseApp | null = null

function initializeFirebaseApp(): FirebaseApp | null {
  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp
  }

  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]
    return firebaseApp
  }

  // Initialize new app
  try {
    const config = getFirebaseConfig()
    if (!config) {
      return null // Config is missing, return null instead of throwing
    }
    firebaseApp = initializeApp(config)
    return firebaseApp
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    return null // Return null instead of throwing to allow app to work without Firebase
  }
}

/**
 * Get or initialize Firebase app instance (lazy)
 */
function getFirebaseAppInstance(): FirebaseApp | null {
  return initializeFirebaseApp()
}

/**
 * Firestore database instance (lazy initialization)
 * Returns null if Firebase is not configured
 */
let dbInstance: Firestore | null = null

export function getDb(): Firestore | null {
  if (!dbInstance) {
    const app = getFirebaseAppInstance()
    if (!app) return null
    try {
      dbInstance = getFirestore(app)
    } catch (error) {
      console.error('Failed to initialize Firestore:', error)
      return null
    }
  }
  return dbInstance
}

// Export db for backward compatibility (but it's now a getter)
export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getDb()
    if (!instance) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }
    return (instance as any)[prop]
  }
})

/**
 * Firebase Authentication instance (lazy initialization)
 * Returns null if Firebase is not configured
 */
let authInstance: Auth | null = null

export function getAuthInstance(): Auth | null {
  if (!authInstance) {
    const app = getFirebaseAppInstance()
    if (!app) return null
    try {
      authInstance = getAuth(app)
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error)
      return null
    }
  }
  return authInstance
}

// Export auth for backward compatibility (but it's now a getter)
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getAuthInstance()
    if (!instance) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }
    return (instance as any)[prop]
  }
})

/**
 * Test Firebase connection
 * 
 * @returns Promise that resolves to true if connection is successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔥 Testing Firebase connection...')
    console.log('📋 Checking configuration...')
    
    const dbInstance = getDb()
    const authInstance = getAuthInstance()
    
    if (!dbInstance || !authInstance) {
      console.error('❌ Firebase instances are null')
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }
    
    console.log('✅ Firebase instances initialized')
    
    // Test Auth connection first (doesn't require network)
    console.log('🔐 Testing Auth connection...')
    if (!authInstance.app) {
      throw new Error('Firebase Auth not initialized')
    }
    console.log('✅ Auth connection successful')
    
    // Test Firestore connection
    console.log('📊 Testing Firestore connection...')
    const testDocRef = doc(dbInstance, '_test', 'connection')
    
    try {
      // Attempt to read (will succeed even if document doesn't exist)
      await getDoc(testDocRef)
      console.log('✅ Firestore connection successful')
    } catch (firestoreError: any) {
      // Handle specific Firestore errors
      if (firestoreError?.code === 'failed-precondition') {
        throw new Error(
          'Firestore is not enabled in your Firebase project. Please enable Firestore in the Firebase Console: https://console.firebase.google.com'
        )
      } else if (firestoreError?.code === 'unavailable' || firestoreError?.message?.includes('offline')) {
        throw new Error(
          'Firestore client is offline. This usually means:\n' +
          '1. Firestore is not enabled in your Firebase project\n' +
          '2. Check your internet connection\n' +
          '3. Enable Firestore in Firebase Console: https://console.firebase.google.com → Your Project → Firestore Database → Create Database'
        )
      } else if (firestoreError?.code === 'permission-denied') {
        throw new Error(
          'Firestore permission denied. Please check your Firestore security rules in the Firebase Console.'
        )
      }
      throw firestoreError
    }

    console.log('🎉 All Firebase services connected successfully!')
    return true
  } catch (error) {
    console.error('❌ Firebase connection test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Firebase connection test failed: ${errorMessage}`)
  }
}

/**
 * Get the Firebase app instance (for advanced usage)
 * Returns null if Firebase is not configured
 */
export function getFirebaseApp(): FirebaseApp | null {
  return getFirebaseAppInstance()
}

/**
 * Convert FirestoreDate to Firestore Timestamp
 */
function toFirestoreTimestamp(date: FirestoreDate): Timestamp {
  if (date instanceof Date) {
    return Timestamp.fromDate(date)
  }
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date))
  }
  return Timestamp.now()
}

/**
 * Convert Firestore Timestamp to ISO string
 */
function fromFirestoreTimestamp(timestamp: any): string {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString()
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString()
  }
  if (typeof timestamp === 'string') {
    return timestamp
  }
  return new Date().toISOString()
}

/**
 * Convert Firestore document data to Event type
 */
export function convertFirestoreEvent(data: any, id: string): Event {
  try {
    // Ensure required fields exist
    if (!data.name) {
      console.warn('⚠️ Event data missing name field')
    }
    if (!data.date) {
      console.warn('⚠️ Event data missing date field')
    }
    if (!data.organizerId) {
      console.warn('⚠️ Event data missing organizerId field')
    }
    if (!data.status) {
      console.warn('⚠️ Event data missing status field, defaulting to "active"')
    }

    const convertedEvent: Event = {
      id,
      code: data.code || '', // TODO: Generate code if missing
      name: data.name || 'Unnamed Event',
      date: data.date ? fromFirestoreTimestamp(data.date) : new Date().toISOString(),
      budget: data.budget,
      organizerId: data.organizerId || '',
      participants: (data.participants || []).map((p: any) => {
        // Ensure participant has required fields
        if (!p.id) {
          console.warn('⚠️ Participant missing id:', p)
        }
        if (!p.name) {
          console.warn('⚠️ Participant missing name:', p)
        }
        return {
          id: p.id || `unknown-${Date.now()}`,
          eventId: p.eventId || id, // Use event id if eventId not set
          name: p.name || 'Unknown',
          email: p.email,
          wishlist: p.wishlist,
          isReady: p.isReady ?? false,
          joinedAt: p.joinedAt ? fromFirestoreTimestamp(p.joinedAt) : (p.createdAt ? fromFirestoreTimestamp(p.createdAt) : new Date().toISOString()),
        }
      }),
      exclusions: data.exclusions || [],
      status: data.status || 'active',
      description: data.description,
      createdAt: data.createdAt ? fromFirestoreTimestamp(data.createdAt) : new Date().toISOString(),
    }

    console.log('🔄 Converted event:', {
      id: convertedEvent.id,
      name: convertedEvent.name,
      participants: convertedEvent.participants.length,
      status: convertedEvent.status,
    })

    return convertedEvent
  } catch (error) {
    console.error('❌ Error converting Firestore event:', error)
    throw new Error(`Failed to convert event data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert Firestore document data to Assignment type
 * (Reserved for future use when fetching assignments)
 */
// function convertFirestoreAssignment(data: any): Assignment {
//   return {
//     eventId: data.eventId,
//     giverId: data.giverId,
//     receiverId: data.receiverId,
//     revealedAt: data.revealedAt ? fromFirestoreTimestamp(data.revealedAt) : null,
//     createdAt: fromFirestoreTimestamp(data.createdAt),
//     updatedAt: data.updatedAt ? fromFirestoreTimestamp(data.updatedAt) : undefined,
//   }
// }

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined)
  }
  const cleaned: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = removeUndefined(obj[key])
    }
  }
  return cleaned
}

/**
 * Create a new event in Firestore
 * 
 * @param eventData - Event data without ID (will be auto-generated)
 * @returns Promise that resolves to the created event ID
 * @throws Error if Firebase is not configured or creation fails
 */
export async function createEvent(eventData: Omit<EventData, 'createdAt'>): Promise<string> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    const now = new Date().toISOString()
    // Generate a simple code if not provided (6 alphanumeric characters)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }
    
    const eventDoc: Omit<EventData, 'id'> = {
      ...eventData,
      code: eventData.code || generateCode(),
      date: typeof eventData.date === 'string' ? eventData.date : eventData.date.toISOString(),
      participants: eventData.participants.map(p => {
        const participant: any = {
          id: p.id,
          eventId: '', // Will be set after event creation
          name: p.name,
          isReady: p.isReady ?? false,
          joinedAt: p.joinedAt || now,
        }
        // Only include optional fields if they have values
        if (p.email) participant.email = p.email
        if (p.wishlist && p.wishlist.length > 0) participant.wishlist = p.wishlist
        return participant
      }),
      createdAt: now,
    }

    // Convert dates to Firestore Timestamps and prepare data
    const firestoreDataRaw: any = {
      name: eventDoc.name,
      code: eventDoc.code,
      date: toFirestoreTimestamp(eventDoc.date),
      organizerId: eventDoc.organizerId,
      status: eventDoc.status,
      createdAt: serverTimestamp(),
      participants: eventDoc.participants.map(p => {
        const participant: any = {
          id: p.id,
          eventId: '', // Will be updated after event creation
          name: p.name,
          isReady: p.isReady ?? false,
          joinedAt: p.joinedAt ? toFirestoreTimestamp(p.joinedAt) : serverTimestamp(),
        }
        // Only include optional fields if they have values
        if (p.email) participant.email = p.email
        if (p.wishlist && p.wishlist.length > 0) participant.wishlist = p.wishlist
        return participant
      }),
    }

    // Add optional fields only if they exist
    if (eventDoc.budget !== undefined && eventDoc.budget !== null) {
      firestoreDataRaw.budget = eventDoc.budget
    }
    if (eventDoc.description) {
      firestoreDataRaw.description = eventDoc.description
    }
    if (eventDoc.exclusions && eventDoc.exclusions.length > 0) {
      firestoreDataRaw.exclusions = eventDoc.exclusions
    }

    // Remove any remaining undefined values
    const firestoreData = removeUndefined(firestoreDataRaw)

    // Debug: Log what we're saving
    console.log('💾 Saving event to Firestore:', {
      name: firestoreData.name,
      code: firestoreData.code,
      organizerId: firestoreData.organizerId,
      participantsCount: firestoreData.participants?.length || 0,
      status: firestoreData.status,
    })

    // Create document with auto-generated ID
    const eventsRef = collection(db, 'events')
    const docRef = await addDoc(eventsRef, firestoreData)
    
    console.log('✅ Event saved with document ID:', docRef.id)
    
    // Update participants with eventId
    const participantsWithEventId = eventDoc.participants.map(p => ({
      ...p,
      eventId: docRef.id,
    }))
    
    // Update the event with participants that have eventId
    if (participantsWithEventId.length > 0) {
      const participantsUpdate = participantsWithEventId.map(p => {
        const participant: any = {
          id: p.id,
          eventId: docRef.id,
          name: p.name,
          isReady: p.isReady ?? false,
          joinedAt: p.joinedAt ? toFirestoreTimestamp(p.joinedAt) : serverTimestamp(),
        }
        if (p.email) participant.email = p.email
        if (p.wishlist && p.wishlist.length > 0) participant.wishlist = p.wishlist
        return participant
      })
      await updateDoc(docRef, { participants: participantsUpdate })
    }
    
    console.log('✅ Event created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error creating event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to create event: ${errorMessage}`)
  }
}

/**
 * Fetch an event by ID from Firestore
 * 
 * @param eventId - The event document ID
 * @returns Promise that resolves to the Event object, or null if not found
 * @throws Error if Firebase is not configured or fetch fails
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    console.log('🔍 Fetching event from Firebase:', eventId)
    const eventRef = doc(db, 'events', eventId)
    const eventSnap = await getDoc(eventRef)

    if (!eventSnap.exists()) {
      console.log(`⚠️ Event ${eventId} not found in Firestore`)
      return null
    }

    const eventData = eventSnap.data()
    console.log('📦 Raw Firestore data:', {
      id: eventSnap.id,
      name: eventData?.name,
      participantsCount: eventData?.participants?.length || 0,
      status: eventData?.status,
      hasDate: !!eventData?.date,
      hasCreatedAt: !!eventData?.createdAt,
      participants: eventData?.participants,
      fullData: eventData,
    })
    
    const event = convertFirestoreEvent(eventData, eventSnap.id)
    
    console.log('✅ Event converted successfully:', {
      id: event.id,
      name: event.name,
      participantsCount: event.participants.length,
      status: event.status,
      participants: event.participants,
      fullEvent: event,
    })
    
    return event
  } catch (error) {
    console.error('❌ Error fetching event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to fetch event: ${errorMessage}`)
  }
}

/**
 * Fetch an event by code from Firestore
 * 
 * @param code - The event code (e.g., "ABC123")
 * @returns Promise that resolves to the Event object, or null if not found
 * @throws Error if Firebase is not configured or fetch fails
 */
export async function getEventByCode(code: string): Promise<Event | null> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    console.log('🔍 Fetching event by code from Firebase:', code)
    const eventsRef = collection(db, 'events')
    const q = query(eventsRef, where('code', '==', code.toUpperCase().trim()), limit(1))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`⚠️ Event with code ${code} not found in Firestore`)
      return null
    }

    const eventDoc = querySnapshot.docs[0]
    const eventData = eventDoc.data()
    
    console.log('📦 Raw Firestore data:', {
      id: eventDoc.id,
      code: eventData?.code,
      name: eventData?.name,
      participantsCount: eventData?.participants?.length || 0,
      status: eventData?.status,
    })
    
    const event = convertFirestoreEvent(eventData, eventDoc.id)
    
    console.log('✅ Event converted successfully:', {
      id: event.id,
      code: event.code,
      name: event.name,
      participantsCount: event.participants.length,
      status: event.status,
    })
    
    return event
  } catch (error) {
    console.error('❌ Error fetching event by code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to fetch event by code: ${errorMessage}`)
  }
}

/**
 * Update an event in Firestore
 * 
 * @param eventId - The event document ID
 * @param updates - Partial event data to update
 * @returns Promise that resolves when update is complete
 * @throws Error if Firebase is not configured or update fails
 */
export async function updateEvent(
  eventId: string, 
  updates: Partial<Omit<EventData, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    const eventRef = doc(db, 'events', eventId)
    
    // Prepare update data, only including defined fields
    const updateDataRaw: any = {}

    // Add fields only if they are defined
    if (updates.name !== undefined) updateDataRaw.name = updates.name
    if (updates.code !== undefined) updateDataRaw.code = updates.code
    if (updates.date !== undefined) {
      updateDataRaw.date = toFirestoreTimestamp(updates.date)
    }
    if (updates.organizerId !== undefined) updateDataRaw.organizerId = updates.organizerId
    if (updates.status !== undefined) updateDataRaw.status = updates.status
    if (updates.budget !== undefined && updates.budget !== null) {
      updateDataRaw.budget = updates.budget
    }
    if (updates.description !== undefined) updateDataRaw.description = updates.description
    if (updates.exclusions !== undefined) {
      updateDataRaw.exclusions = updates.exclusions.length > 0 ? updates.exclusions : []
    }

    // Convert participant dates if participants are being updated
    if (updates.participants !== undefined) {
      updateDataRaw.participants = updates.participants.map(p => {
        const participant: any = {
          id: p.id,
          eventId: p.eventId || eventId,
          name: p.name,
          isReady: p.isReady ?? false,
          joinedAt: p.joinedAt ? toFirestoreTimestamp(p.joinedAt) : serverTimestamp(),
        }
        // Only include optional fields if they have values
        if (p.email) participant.email = p.email
        if (p.wishlist && p.wishlist.length > 0) participant.wishlist = p.wishlist
        return participant
      })
    }

    // Remove any remaining undefined values
    const updateData = removeUndefined(updateDataRaw)

    await updateDoc(eventRef, updateData)
    
    console.log('✅ Event updated:', eventId)
  } catch (error) {
    console.error('❌ Error updating event:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to update event: ${errorMessage}`)
  }
}

/**
 * Add a participant to an event in Firestore
 * 
 * @param eventId - The event document ID
 * @param participant - Participant data to add
 * @returns Promise that resolves when participant is added
 * @throws Error if Firebase is not configured or operation fails
 */
export async function addParticipant(eventId: string, participant: ParticipantData): Promise<void> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    // First, get the current event
    const event = await getEvent(eventId)
    if (!event) {
      throw new Error(`Event ${eventId} not found`)
    }

    // Add the new participant with timestamps
    const now = new Date().toISOString()
    const { v4: uuidv4 } = await import('uuid')
    const participantId = uuidv4()
    const newParticipant: Participant = {
      id: participantId,
      eventId: eventId,
      name: participant.name,
      email: participant.email,
      wishlist: participant.wishlist,
      isReady: participant.isReady,
      joinedAt: participant.joinedAt || now,
    }

    // Update event with new participant
    const updatedParticipants = [...event.participants, newParticipant]
    await updateEvent(eventId, {
      participants: updatedParticipants,
    })

    console.log('✅ Participant added to event:', eventId, newParticipant.id)
  } catch (error) {
    console.error('❌ Error adding participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to add participant: ${errorMessage}`)
  }
}

/**
 * Fetch assignments for an event from Firestore
 * 
 * @param eventId - The event document ID
 * @returns Promise that resolves to an array of Assignment objects
 * @throws Error if Firebase is not configured or fetch fails
 */
export async function getAssignments(eventId: string): Promise<Assignment[]> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    const assignmentsRef = collection(db, 'events', eventId, 'assignments')
    const querySnapshot = await getDocs(assignmentsRef)

    const assignments: Assignment[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      assignments.push({
        eventId: data.eventId || eventId,
        giverId: data.giverId,
        receiverId: data.receiverId,
        createdAt: data.createdAt ? fromFirestoreTimestamp(data.createdAt) : new Date().toISOString(),
        revealedAt: data.revealedAt ? fromFirestoreTimestamp(data.revealedAt) : null,
      })
    })

    return assignments
  } catch (error) {
    console.error('❌ Error fetching assignments:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to fetch assignments: ${errorMessage}`)
  }
}

/**
 * Save assignments for an event in Firestore
 * 
 * @param eventId - The event document ID
 * @param assignments - Array of assignments to save
 * @returns Promise that resolves when assignments are saved
 * @throws Error if Firebase is not configured or save fails
 */
export async function saveAssignments(eventId: string, assignments: AssignmentData[]): Promise<void> {
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firebase is not configured. Please set Firebase environment variables.')
    }

    // Use batch write for atomic operation
    const batch = writeBatch(db)
    const assignmentsRef = collection(db, 'events', eventId, 'assignments')

    assignments.forEach((assignment) => {
      const now = new Date().toISOString()
      const assignmentDoc = {
        eventId: assignment.eventId,
        giverId: assignment.giverId,
        receiverId: assignment.receiverId,
        createdAt: assignment.createdAt || now,
        revealedAt: assignment.revealedAt,
      }

      // Convert dates to Firestore Timestamps
      const firestoreData: any = {
        eventId: assignmentDoc.eventId,
        giverId: assignmentDoc.giverId,
        receiverId: assignmentDoc.receiverId,
        createdAt: toFirestoreTimestamp(assignmentDoc.createdAt),
      }

      if (assignmentDoc.revealedAt !== null && assignmentDoc.revealedAt !== undefined) {
        firestoreData.revealedAt = toFirestoreTimestamp(assignmentDoc.revealedAt)
      } else {
        firestoreData.revealedAt = null
      }

      // Create document reference with auto-generated ID
      const docRef = doc(assignmentsRef)
      batch.set(docRef, firestoreData)
    })

    // Commit the batch
    await batch.commit()
    
    console.log(`✅ Saved ${assignments.length} assignments for event:`, eventId)
  } catch (error) {
    console.error('❌ Error saving assignments:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to save assignments: ${errorMessage}`)
  }
}

/**
 * Subscribe to real-time updates for an event
 * 
 * @param eventId - The event document ID to subscribe to
 * @param callback - Function called whenever the event data changes
 * @returns Unsubscribe function to stop listening to updates
 * @throws Error if Firebase is not configured
 */
export function subscribeToEvent(
  eventId: string,
  callback: (event: Event | null, error: Error | null) => void
): Unsubscribe {
  try {
    const db = getDb()
    if (!db) {
      const error = new Error('Firebase is not configured. Please set Firebase environment variables.')
      callback(null, error)
      // Return a no-op unsubscribe function
      return () => {}
    }

    const eventRef = doc(db, 'events', eventId)

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      eventRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            console.log(`⚠️ Event ${eventId} not found in real-time subscription`)
            callback(null, null)
            return
          }

          const eventData = snapshot.data()
          const event = convertFirestoreEvent(eventData, snapshot.id)
          
          console.log('✅ Real-time event update received:', eventId)
          callback(event, null)
        } catch (error) {
          console.error('❌ Error processing real-time event update:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          callback(null, new Error(`Failed to process event update: ${errorMessage}`))
        }
      },
      (error) => {
        // Error callback for onSnapshot
        console.error('❌ Real-time subscription error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        callback(null, new Error(`Real-time subscription failed: ${errorMessage}`))
      }
    )

    console.log('✅ Real-time subscription started for event:', eventId)
    return unsubscribe
  } catch (error) {
    console.error('❌ Error setting up real-time subscription:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    callback(null, new Error(`Failed to set up subscription: ${errorMessage}`))
    // Return a no-op unsubscribe function
    return () => {}
  }
}

// Export types for use in other modules
export type { FirebaseApp, Firestore, Auth }
