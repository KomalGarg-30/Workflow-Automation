import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { createGoogleOAuthClient } from '@/lib/google-oauth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const redirectUrl = new URL('/connections', request.url)
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const [expectedState, expectedUserId] =
    request.cookies.get('google_oauth_state')?.value?.split(':') || []
  const receivedState = request.nextUrl.searchParams.get('state')
  if (
    !expectedState ||
    expectedUserId !== user.authId ||
    !receivedState ||
    expectedState.length !== receivedState.length ||
    !timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState))
  ) {
    return NextResponse.redirect(redirectUrl)
  }

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(redirectUrl)

  const oauth = createGoogleOAuthClient()
  const { tokens } = await oauth.getToken(code)
  if (!tokens.access_token) {
    throw new Error('Google OAuth did not return an access token.')
  }

  const existing = await db.localGoogleCredential.findUnique({
    where: { userId: user.id },
  })
  await db.localGoogleCredential.upsert({
    where: { userId: user.id },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || existing?.refreshToken,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    create: {
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  })

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.delete('google_oauth_state')
  return response
}
