import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const providerScopes: Record<string, string> = {
  discord: 'identify guilds connections guilds.members.read email webhook.incoming',
  slack: 'chat:write,channels:read,groups:read,mpim:read,im:read',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const provider = params.provider
  const clientId =
    provider === 'discord'
      ? process.env.DISCORD_CLIENT_ID
      : provider === 'slack'
      ? process.env.SLACK_CLIENT_ID
      : null
  if (!clientId || !(provider in providerScopes)) {
    return NextResponse.json({ error: 'Unsupported provider.' }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin
  const redirectUri =
    provider === 'slack'
      ? process.env.SLACK_REDIRECT_URI
      : `${baseUrl}/api/auth/callback/discord`
  if (!redirectUri) throw new Error(`${provider} redirect URI is not configured.`)

  const state = randomBytes(32).toString('base64url')
  const authorizationUrl = new URL(
    provider === 'discord'
      ? 'https://discord.com/oauth2/authorize'
      : 'https://slack.com/oauth/v2/authorize'
  )

  if (provider === 'discord') {
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: providerScopes[provider],
      state,
    }).toString()
  } else {
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      scope: providerScopes[provider],
      user_scope: providerScopes[provider],
      redirect_uri: redirectUri,
      state,
    }).toString()
  }

  const response = NextResponse.redirect(authorizationUrl)
  response.cookies.set(`oauth_state_${provider}`, `${state}:${user.authId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return response
}
