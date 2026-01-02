/**
 * Secret Santa Assignment Generator
 * 
 * This module implements a robust algorithm for generating Secret Santa assignments
 * using the Fisher-Yates shuffle with validation to ensure:
 * - No self-assignments
 * - Exclusion pairs are respected
 * - Edge cases are handled (e.g., last person problem)
 */

/**
 * Represents a participant in the Secret Santa exchange
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: string
  /** Display name of the participant */
  name: string
  /** Email address (optional, for notifications) */
  email?: string
}

/**
 * Configuration options for assignment generation
 */
export interface AssignmentOptions {
  /** Maximum number of attempts before giving up */
  maxAttempts?: number
}

/**
 * Result of assignment generation
 */
export interface AssignmentResult {
  /** Map of giver ID to receiver ID */
  assignments: Map<string, string>
  /** Number of attempts made */
  attempts: number
}

/**
 * Custom error for impossible assignment configurations
 */
export class ImpossibleAssignmentError extends Error {
  participants: Participant[]
  exclusions?: string[][]

  constructor(
    message: string,
    participants: Participant[],
    exclusions?: string[][]
  ) {
    super(message)
    this.name = 'ImpossibleAssignmentError'
    this.participants = participants
    this.exclusions = exclusions
  }
}

/**
 * Generates Secret Santa assignments using Fisher-Yates shuffle with validation.
 * 
 * Algorithm:
 * 1. Create a shuffled list of receiver IDs using Fisher-Yates
 * 2. Validate that no giver gets themselves
 * 3. Validate that no exclusion pairs are violated
 * 4. If validation fails, retry up to maxAttempts times
 * 5. Handle edge cases (e.g., last person can only get themselves)
 * 
 * @param participants - Array of participants in the exchange
 * @param exclusions - Optional array of exclusion pairs [id1, id2] where id1 cannot get id2
 * @param options - Optional configuration (maxAttempts defaults to 1000)
 * @returns Map where key is giver ID and value is receiver ID
 * @throws {ImpossibleAssignmentError} If valid assignment is impossible
 * 
 * Example usage:
 * ```typescript
 * const participants = [
 *   { id: '1', name: 'Alice' },
 *   { id: '2', name: 'Bob' },
 *   { id: '3', name: 'Charlie' },
 *   { id: '4', name: 'Diana' }
 * ]
 * 
 * // Normal case - no exclusions
 * const assignments = generateAssignments(participants)
 * // Result: Map { '1' => '3', '2' => '1', '3' => '4', '4' => '2' }
 * 
 * // With exclusions - partners can't get each other
 * const exclusions = [['1', '2'], ['3', '4']] // Alice-Bob, Charlie-Diana
 * const assignments = generateAssignments(participants, exclusions)
 * ```
 */
export function generateAssignments(
  participants: Participant[],
  exclusions?: string[][],
  options: AssignmentOptions = {}
): Map<string, string> {
  const { maxAttempts = 1000 } = options

  // Validation: Need at least 2 participants
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants for Secret Santa')
  }

  // Extract participant IDs
  const participantIds = participants.map(p => p.id)

  // Validate exclusion pairs
  if (exclusions) {
    for (const [id1, id2] of exclusions) {
      if (!participantIds.includes(id1) || !participantIds.includes(id2)) {
        throw new Error(`Exclusion pair contains invalid participant ID: [${id1}, ${id2}]`)
      }
    }
  }

  // Check if assignment is theoretically possible
  if (!isAssignmentPossible(participants, exclusions)) {
    throw new ImpossibleAssignmentError(
      'Assignment is impossible with given exclusions. Too many constraints.',
      participants,
      exclusions
    )
  }

  // Try to generate valid assignment
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const assignments = attemptAssignment(participants, exclusions)
      if (assignments) {
        return assignments
      }
    } catch (error) {
      // Continue to next attempt
      if (attempt === maxAttempts) {
        throw new ImpossibleAssignmentError(
          `Failed to generate valid assignment after ${maxAttempts} attempts. Configuration may be impossible.`,
          participants,
          exclusions
        )
      }
    }
  }

  throw new ImpossibleAssignmentError(
    `Failed to generate valid assignment after ${maxAttempts} attempts.`,
    participants,
    exclusions
  )
}

/**
 * Attempts to generate a valid assignment using Fisher-Yates shuffle.
 * 
 * @param participants - Array of participants
 * @param exclusions - Optional exclusion pairs
 * @returns Map of assignments or null if invalid
 */
function attemptAssignment(
  participants: Participant[],
  exclusions?: string[][]
): Map<string, string> | null {
  const participantIds = participants.map(p => p.id)
  const receivers = fisherYatesShuffle([...participantIds])
  const assignments = new Map<string, string>()

  // Create assignment map
  for (let i = 0; i < participantIds.length; i++) {
    assignments.set(participantIds[i], receivers[i])
  }

  // Validate assignments
  if (!isValidAssignment(assignments, participantIds, exclusions)) {
    return null
  }

  return assignments
}

/**
 * Validates that an assignment is valid (no self-assignments, no exclusions violated).
 * 
 * @param assignments - Map of giver to receiver
 * @param participantIds - Array of all participant IDs
 * @param exclusions - Optional exclusion pairs
 * @returns True if assignment is valid
 */
function isValidAssignment(
  assignments: Map<string, string>,
  _participantIds: string[],
  exclusions?: string[][]
): boolean {
  // Check for self-assignments
  for (const [giver, receiver] of assignments) {
    if (giver === receiver) {
      return false
    }
  }

  // Check exclusion pairs
  if (exclusions) {
    for (const [id1, id2] of exclusions) {
      // id1 cannot get id2, and id2 cannot get id1
      if (assignments.get(id1) === id2 || assignments.get(id2) === id1) {
        return false
      }
    }
  }

  return true
}

/**
 * Checks if a valid assignment is theoretically possible.
 * 
 * For small groups with many exclusions, assignment might be impossible.
 * This is a heuristic check - not perfect but catches obvious cases.
 * 
 * @param participants - Array of participants
 * @param exclusions - Optional exclusion pairs
 * @returns True if assignment might be possible
 */
function isAssignmentPossible(
  participants: Participant[],
  exclusions?: string[][]
): boolean {
  const n = participants.length

  // With 2 participants and 1 exclusion, it's impossible
  if (n === 2 && exclusions && exclusions.length >= 1) {
    const [id1, id2] = exclusions[0]
    const participantIds = participants.map(p => p.id)
    if (participantIds.includes(id1) && participantIds.includes(id2)) {
      return false
    }
  }

  // For larger groups, check if exclusions are too restrictive
  if (exclusions && n > 2) {
    // Count how many people each person is excluded from
    const exclusionCount = new Map<string, number>()
    for (const [id1, id2] of exclusions) {
      exclusionCount.set(id1, (exclusionCount.get(id1) || 0) + 1)
      exclusionCount.set(id2, (exclusionCount.get(id2) || 0) + 1)
    }

    // If someone is excluded from too many people, it might be impossible
    // (n-2) because they can't get themselves and can't get their exclusions
    for (const [, count] of exclusionCount) {
      if (count >= n - 1) {
        return false
      }
    }
  }

  return true
}

/**
 * Fisher-Yates shuffle algorithm for creating a random permutation.
 * 
 * This is an unbiased shuffle algorithm that produces each permutation
 * with equal probability.
 * 
 * @param array - Array to shuffle
 * @returns New array with shuffled elements
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1))
    
    // Swap elements
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * Test Cases:
 * 
 * Test Case 1: Normal case (4 participants, no exclusions)
 * ```typescript
 * const participants1 = [
 *   { id: '1', name: 'Alice' },
 *   { id: '2', name: 'Bob' },
 *   { id: '3', name: 'Charlie' },
 *   { id: '4', name: 'Diana' }
 * ]
 * const assignments1 = generateAssignments(participants1)
 * ```
 * 
 * Test Case 2: With exclusions (partners can't get each other)
 * ```typescript
 * const participants2 = [
 *   { id: '1', name: 'Alice' },
 *   { id: '2', name: 'Bob' },
 *   { id: '3', name: 'Charlie' },
 *   { id: '4', name: 'Diana' }
 * ]
 * const exclusions2 = [['1', '2'], ['3', '4']] // Partners
 * const assignments2 = generateAssignments(participants2, exclusions2)
 * ```
 * 
 * Test Case 3: Edge case (3 participants, 1 exclusion)
 * ```typescript
 * const participants3 = [
 *   { id: '1', name: 'Alice' },
 *   { id: '2', name: 'Bob' },
 *   { id: '3', name: 'Charlie' }
 * ]
 * const exclusions3 = [['1', '2']] // Alice can't get Bob
 * const assignments3 = generateAssignments(participants3, exclusions3)
 * ```
 * 
 * Test Case 4: Large group (10+ participants)
 * ```typescript
 * const participants4 = Array.from({ length: 12 }, (_, i) => ({
 *   id: String(i + 1),
 *   name: `Person ${i + 1}`
 * }))
 * const assignments4 = generateAssignments(participants4)
 * ```
 */

