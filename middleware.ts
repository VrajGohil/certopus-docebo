import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('admin_session')
  
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isLoginApi = req.nextUrl.pathname === '/api/auth/login'
  const isLogoutApi = req.nextUrl.pathname === '/api/auth/logout'
  const isWebhookRoute = req.nextUrl.pathname === '/api/webhook'

  // Allow webhook route without authentication (external calls from Docebo)
  if (isWebhookRoute) {
    return NextResponse.next()
  }

  // Allow login page and auth API routes
  if (isLoginPage || isLoginApi || isLogoutApi) {
    return NextResponse.next()
  }

  // Check authentication
  let isAuthenticated = false
  if (session) {
    try {
      const sessionData = JSON.parse(session.value)
      const now = Date.now()
      isAuthenticated = sessionData.authenticated === true && sessionData.expires > now
    } catch (error) {
      isAuthenticated = false
    }
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
