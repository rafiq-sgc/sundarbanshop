/**
 * Password Generation Utility
 * Generates secure, user-friendly passwords for phone/walk-in customers
 */

/**
 * Generate a secure, memorable password
 * Format: EKM-XXXX-XXXX (e.g., EKM-A7B9-K3L5)
 */
export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar chars (I, O, 1, 0)
  const segments = 2
  const segmentLength = 4
  
  const password: string[] = ['EKM'] // Brand prefix
  
  for (let i = 0; i < segments; i++) {
    let segment = ''
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    password.push(segment)
  }
  
  return password.join('-')
}

/**
 * Generate a simple numeric PIN (for SMS)
 * Format: 6-digit number
 */
export function generateNumericPIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generate a verification token for guest order tracking
 * Format: Random 32-character hex string
 */
export function generateTrackingToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

/**
 * Validate password strength (for user-created passwords)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

