import { signOut } from 'next-auth/react'
import { NextResponse } from 'next/server'

/**
 * Handle unauthorized errors by clearing session and redirecting to login
 */
export const handleUnauthorized = async () => {
  try {
    // Clear all session data
    await signOut({ 
      redirect: false,
      callbackUrl: '/auth/signin'
    })
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    
    // Redirect to login
    window.location.href = '/auth/signin'
  } catch (error) {
    console.error('Error during logout:', error)
    // Force redirect even if signOut fails
    window.location.href = '/auth/signin'
  }
}

/**
 * Check if user is authorized for admin access
 */
export const isAdminAuthorized = (session: any): boolean => {
  return session && session.user && session.user.role === 'admin'
}

/**
 * Create unauthorized response for API routes
 */
export const createUnauthorizedResponse = (message: string = 'Unauthorized') => {
  return NextResponse.json(
    { 
      success: false, 
      message,
      code: 'UNAUTHORIZED',
      redirect: '/auth/signin'
    }, 
    { status: 401 }
  )
}

/**
 * Handle API errors and check for unauthorized
 */
export const handleApiError = (error: any, response: Response) => {
  if (response.status === 401) {
    // Unauthorized - redirect to login
    if (typeof window !== 'undefined') {
      handleUnauthorized()
    }
    return { success: false, message: 'Unauthorized', shouldRedirect: true }
  }
  
  return { 
    success: false, 
    message: error.message || 'An error occurred',
    shouldRedirect: false 
  }
}

/**
 * Enhanced fetch with automatic unauthorized handling
 */
export const authFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      // Unauthorized - handle logout and redirect
      await handleUnauthorized()
      throw new Error('Unauthorized')
    }

    return response
  } catch (error) {
    console.error('Auth fetch error:', error)
    throw error
  }
}
