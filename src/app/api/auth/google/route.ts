import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createGoogleOAuthClient } from '@/lib/google-oauth'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const state = randomBytes(32).toString('base64url')
  const response = NextResponse.redirect(
    createGoogleOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive'],
      state,
    })
  )
  response.cookies.set('google_oauth_state', `${state}:${user.authId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return response
}
