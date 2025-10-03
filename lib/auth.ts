import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)
  
  if (!session) {
    return false
  }

  try {
    const sessionData = JSON.parse(session.value)
    const now = Date.now()
    
    // Check if session is expired
    if (sessionData.expires < now) {
      return false
    }
    
    return sessionData.authenticated === true
  } catch (error) {
    return false
  }
}

export async function createSession(): Promise<void> {
  const cookieStore = cookies()
  const sessionData = {
    authenticated: true,
    expires: Date.now() + SESSION_DURATION
  }
  
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured in environment variables')
    return false
  }
  
  return password === adminPassword
}
