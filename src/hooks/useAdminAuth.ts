import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { handleUnauthorized } from '@/lib/auth-utils'

export const useAdminAuth = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (!session) {
      // No session - redirect to login
      router.push('/auth/signin')
      setLoading(false)
      return
    }

    if (session.user.role !== 'admin') {
      // Not admin - handle unauthorized
      handleUnauthorized()
      setLoading(false)
      return
    }

    // Authorized
    setIsAuthorized(true)
    setLoading(false)
  }, [session, status, router])

  return {
    session,
    isAuthorized,
    loading,
    isAdmin: session?.user?.role === 'admin'
  }
}

/**
 * Enhanced fetch function that handles unauthorized errors automatically
 */
export const useAuthFetch = () => {
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response
    } catch (error) {
      console.error('Auth fetch error:', error)
      throw error
    }
  }

  return { fetchWithAuth }
}
