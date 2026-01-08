/**
 * Confetti Animation Utilities
 * 
 * Provides confetti animations for celebratory moments using canvas-confetti
 */

import confetti from 'canvas-confetti'

/**
 * Trigger a confetti burst animation
 */
export function triggerConfetti(options?: {
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
}): void {
  const defaultOptions = {
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
  }

  confetti({
    ...defaultOptions,
    ...options,
  })
}

/**
 * Trigger a confetti celebration (multiple bursts)
 */
export function triggerConfettiCelebration(): void {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    })
  }, 250)
}

/**
 * Trigger confetti for draw completion
 */
export function triggerDrawConfetti(): void {
  // Center burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
  })

  // Side bursts
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FFD700', '#FF6B6B'],
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#4ECDC4', '#45B7D1'],
    })
  }, 250)
}
