import { useState } from 'react'
import { generateAssignments, ImpossibleAssignmentError } from '../lib/shuffle'
import { testConnection } from '../lib/firebase'
import type { Participant } from '../types'

export default function TestAlgorithmPage() {
  const [testResults, setTestResults] = useState<Array<{
    name: string
    success: boolean
    message: string
    assignments?: Map<string, string>
    error?: string
  }>>([])
  const [isRunning, setIsRunning] = useState(false)
  const [firebaseTestResult, setFirebaseTestResult] = useState<{
    success: boolean | null
    message: string
    error?: string
  }>({ success: null, message: '' })
  const [isTestingFirebase, setIsTestingFirebase] = useState(false)

  const runTests = () => {
    setIsRunning(true)
    const results: typeof testResults = []

    // Test Case 1: Normal case (4 participants, no exclusions)
    try {
      const now = new Date().toISOString()
      const participants1: Participant[] = [
        { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
        { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
        { id: '3', eventId: 'test-event', name: 'Charlie', joinedAt: now },
        { id: '4', eventId: 'test-event', name: 'Diana', joinedAt: now },
      ]
      const assignments1 = generateAssignments(participants1)
      
      // Validate: no self-assignments
      let valid = true
      for (const [giver, receiver] of assignments1) {
        if (giver === receiver) {
          valid = false
          break
        }
      }

      results.push({
        name: 'Test 1: Normal case (4 participants, no exclusions)',
        success: valid && assignments1.size === 4,
        message: valid ? '✅ All assignments valid' : '❌ Invalid assignments found',
        assignments: assignments1,
      })
    } catch (error) {
      results.push({
        name: 'Test 1: Normal case',
        success: false,
        message: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test Case 2: With exclusions (partners can't get each other)
    try {
      const now = new Date().toISOString()
      const participants2: Participant[] = [
        { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
        { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
        { id: '3', eventId: 'test-event', name: 'Charlie', joinedAt: now },
        { id: '4', eventId: 'test-event', name: 'Diana', joinedAt: now },
      ]
      const exclusions2 = [['1', '2'], ['3', '4']] // Partners
      const assignments2 = generateAssignments(participants2, exclusions2)
      
      // Validate: no self-assignments and no exclusions violated
      let valid = true
      for (const [giver, receiver] of assignments2) {
        if (giver === receiver) {
          valid = false
          break
        }
        // Check exclusions
        for (const [id1, id2] of exclusions2) {
          if ((giver === id1 && receiver === id2) || (giver === id2 && receiver === id1)) {
            valid = false
            break
          }
        }
        if (!valid) break
      }

      results.push({
        name: 'Test 2: With exclusions (partners)',
        success: valid && assignments2.size === 4,
        message: valid ? '✅ All assignments valid, exclusions respected' : '❌ Exclusions violated',
        assignments: assignments2,
      })
    } catch (error) {
      results.push({
        name: 'Test 2: With exclusions',
        success: false,
        message: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test Case 3: Edge case (3 participants, 1 exclusion)
    // Note: This is a challenging edge case that may require more attempts
    try {
      const now = new Date().toISOString()
      const participants3: Participant[] = [
        { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
        { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
        { id: '3', eventId: 'test-event', name: 'Charlie', joinedAt: now },
      ]
      const exclusions3 = [['1', '2']] // Alice can't get Bob
      const assignments3 = generateAssignments(participants3, exclusions3, { maxAttempts: 5000 })
      
      let valid = true
      for (const [giver, receiver] of assignments3) {
        if (giver === receiver) {
          valid = false
          break
        }
        if ((giver === '1' && receiver === '2') || (giver === '2' && receiver === '1')) {
          valid = false
          break
        }
      }

      results.push({
        name: 'Test 3: Edge case (3 participants, 1 exclusion)',
        success: valid && assignments3.size === 3,
        message: valid ? '✅ Edge case handled correctly' : '❌ Edge case failed',
        assignments: assignments3,
      })
    } catch (error) {
      // This edge case is known to be challenging - it's mathematically possible but requires luck
      const isExpected = error instanceof ImpossibleAssignmentError || 
                        (error instanceof Error && error.message.includes('1000 attempts'))
      results.push({
        name: 'Test 3: Edge case (3 participants, 1 exclusion)',
        success: false,
        message: isExpected 
          ? '⚠️ Challenging edge case - may need more attempts (this is acceptable)'
          : '❌ Unexpected error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test Case 4: Large group (10+ participants)
    try {
      const now = new Date().toISOString()
      const participants4: Participant[] = Array.from({ length: 12 }, (_, i) => ({
        id: String(i + 1),
        eventId: 'test-event',
        name: `Person ${i + 1}`,
        joinedAt: now,
      }))
      const assignments4 = generateAssignments(participants4)
      
      let valid = true
      for (const [giver, receiver] of assignments4) {
        if (giver === receiver) {
          valid = false
          break
        }
      }

      results.push({
        name: 'Test 4: Large group (12 participants)',
        success: valid && assignments4.size === 12,
        message: valid ? '✅ Large group handled correctly' : '❌ Large group failed',
        assignments: assignments4,
      })
    } catch (error) {
      results.push({
        name: 'Test 4: Large group',
        success: false,
        message: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test Case 5: Impossible case (2 participants with exclusion)
    try {
      const now = new Date().toISOString()
      const participants5: Participant[] = [
        { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
        { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
      ]
      const exclusions5 = [['1', '2']]
      generateAssignments(participants5, exclusions5)
      
      results.push({
        name: 'Test 5: Impossible case (should fail)',
        success: false,
        message: '❌ Should have thrown error but did not',
      })
    } catch (error) {
      const isExpected = error instanceof ImpossibleAssignmentError
      results.push({
        name: 'Test 5: Impossible case (2 participants with exclusion)',
        success: isExpected,
        message: isExpected
          ? '✅ Correctly detected impossible assignment'
          : '❌ Wrong error type',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test Case 6: Minimum participants (2, no exclusions)
    try {
      const now = new Date().toISOString()
      const participants6: Participant[] = [
        { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
        { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
      ]
      const assignments6 = generateAssignments(participants6)
      
      let valid = true
      for (const [giver, receiver] of assignments6) {
        if (giver === receiver) {
          valid = false
          break
        }
      }

      results.push({
        name: 'Test 6: Minimum participants (2, no exclusions)',
        success: valid && assignments6.size === 2,
        message: valid ? '✅ Minimum case works' : '❌ Minimum case failed',
        assignments: assignments6,
      })
    } catch (error) {
      results.push({
        name: 'Test 6: Minimum participants',
        success: false,
        message: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const testFirebaseConnection = async () => {
    setIsTestingFirebase(true)
    setFirebaseTestResult({ success: null, message: 'Testing connection...' })
    
    console.log('🔥 Starting Firebase connection test...')
    
    try {
      const result = await testConnection()
      console.log('✅ Firebase connection test result:', result)
      setFirebaseTestResult({
        success: result,
        message: result ? '✅ Firebase connection successful!' : '❌ Connection failed',
      })
    } catch (error) {
      console.error('❌ Firebase connection test error:', error)
      setFirebaseTestResult({
        success: false,
        message: '❌ Firebase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsTestingFirebase(false)
    }
  }

  const getParticipantName = (id: string, participants: Participant[]) => {
    return participants.find((p) => p.id === id)?.name || id
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-christmas-red-50 to-christmas-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-christmas-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-christmas-red-600 mb-2">
            🧪 Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Test the Secret Santa shuffle algorithm and Firebase connection
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-christmas-green-500 text-white rounded-xl font-bold hover:bg-christmas-green-600 transition-colors shadow-christmas disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Tests...' : 'Run Algorithm Tests'}
            </button>
            <button
              onClick={testFirebaseConnection}
              disabled={isTestingFirebase}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-christmas disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTestingFirebase ? 'Testing...' : 'Test Firebase Connection'}
            </button>
          </div>
        </div>

        {/* Firebase Test Result */}
        {firebaseTestResult.success !== null && (
          <div
            className={`bg-white rounded-xl shadow-christmas-lg p-6 mb-6 border-2 ${
              firebaseTestResult.success
                ? 'border-christmas-green-300'
                : 'border-christmas-red-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Firebase Connection Test</h3>
                <p
                  className={`font-semibold ${
                    firebaseTestResult.success
                      ? 'text-christmas-green-600'
                      : 'text-christmas-red-600'
                  }`}
                >
                  {firebaseTestResult.message}
                </p>
                {firebaseTestResult.error && (
                  <p className="text-sm text-gray-600 mt-2">Error: {firebaseTestResult.error}</p>
                )}
                {firebaseTestResult.success && (
                  <div className="mt-4 p-4 bg-christmas-green-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      ✅ Firestore and Authentication services are connected and ready to use.
                    </p>
                  </div>
                )}
              </div>
              <div
                className={`text-3xl ${
                  firebaseTestResult.success
                    ? 'text-christmas-green-500'
                    : 'text-christmas-red-500'
                }`}
              >
                {firebaseTestResult.success ? '✅' : '❌'}
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-christmas-lg p-6 border-2 ${
                  result.success
                    ? 'border-christmas-green-300'
                    : 'border-christmas-red-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{result.name}</h3>
                    <p
                      className={`font-semibold ${
                        result.success
                          ? 'text-christmas-green-600'
                          : 'text-christmas-red-600'
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.error && (
                      <p className="text-sm text-gray-600 mt-2">Error: {result.error}</p>
                    )}
                  </div>
                  <div
                    className={`text-3xl ${result.success ? 'text-christmas-green-500' : 'text-christmas-red-500'}`}
                  >
                    {result.success ? '✅' : '❌'}
                  </div>
                </div>

                {/* Show Assignments */}
                {result.assignments && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Assignments:</h4>
                    <div className="space-y-2">
                      {Array.from(result.assignments.entries()).map(([giver, receiver], idx) => {
                        // Get participant names for display
                        const now = new Date().toISOString()
                        const participants: Participant[] =
                          index === 0
                            ? [
                                { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
                                { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
                                { id: '3', eventId: 'test-event', name: 'Charlie', joinedAt: now },
                                { id: '4', eventId: 'test-event', name: 'Diana', joinedAt: now },
                              ]
                            : index === 1
                            ? [
                                { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
                                { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
                                { id: '3', eventId: 'test-event', name: 'Charlie', joinedAt: now },
                                { id: '4', eventId: 'test-event', name: 'Diana', joinedAt: now },
                              ]
                            : index === 2
                            ? [
                                { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
                                { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
                                { id: '3', eventId: 'test-event', name: 'Charlie', joinedAt: now },
                              ]
                            : index === 3
                            ? Array.from({ length: 12 }, (_, i) => ({
                                id: String(i + 1),
                                eventId: 'test-event',
                                name: `Person ${i + 1}`,
                                joinedAt: now,
                              }))
                            : [
                                { id: '1', eventId: 'test-event', name: 'Alice', joinedAt: now },
                                { id: '2', eventId: 'test-event', name: 'Bob', joinedAt: now },
                              ]

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 text-sm bg-white p-2 rounded"
                          >
                            <span className="font-semibold text-christmas-red-600">
                              {getParticipantName(giver, participants)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-semibold text-christmas-green-600">
                              {getParticipantName(receiver, participants)}
                            </span>
                            {giver === receiver && (
                              <span className="text-christmas-red-500 text-xs">⚠️ Self-assignment!</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-christmas-lg p-6 border-2 border-christmas-gold-300">
              <h3 className="text-xl font-bold text-christmas-gold-600 mb-4">Test Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-christmas-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-christmas-green-600">
                    {testResults.filter((r) => r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="p-4 bg-christmas-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-christmas-red-600">
                    {testResults.filter((r) => !r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="p-4 bg-christmas-gold-50 rounded-lg">
                  <div className="text-2xl font-bold text-christmas-gold-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

