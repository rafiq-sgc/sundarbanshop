import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Admin routes that require authentication
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isAdminRoute) {
    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check if user is admin
    if (token.role !== 'admin') {
      // Clear session and redirect to login
      const response = NextResponse.redirect(new URL('/auth/signin', request.url))
      
      // Clear auth cookies
      response.cookies.delete('next-auth.session-token')
      response.cookies.delete('__Secure-next-auth.session-token')
      
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}
