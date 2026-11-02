import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { timingSafeEqual } from 'crypto'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const connectionsUrl = new URL('/connections', request.url)
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const [expectedState, expectedUserId] =
    request.cookies.get('oauth_state_slack')?.value?.split(':') || []
  const receivedState = request.nextUrl.searchParams.get('state')
  if (
    !expectedState ||
    expectedUserId !== user.authId ||
    !receivedState ||
    expectedState.length !== receivedState.length ||
    !timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState))
  ) {
    return NextResponse.redirect(connectionsUrl)
  }

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(connectionsUrl)

  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  const redirectUri = process.env.SLACK_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Slack OAuth environment variables are not configured.')
  }

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Slack OAuth failed.')
  }

  const slack = await db.slack.findUnique({
    where: { slackAccessToken: data.access_token },
    select: { userId: true },
  })
  if (slack && slack.userId !== user.authId) {
    throw new Error('This Slack workspace is already linked to another account.')
  }

  const savedSlack = await db.slack.upsert({
    where: { slackAccessToken: data.access_token },
    update: {
      appId: data.app_id,
      authedUserId: data.authed_user.id,
      authedUserToken: data.authed_user.access_token,
      botUserId: data.bot_user_id,
      teamId: data.team.id,
      teamName: data.team.name,
    },
    create: {
      userId: user.authId,
      appId: data.app_id,
      authedUserId: data.authed_user.id,
      authedUserToken: data.authed_user.access_token,
      slackAccessToken: data.access_token,
      botUserId: data.bot_user_id,
      teamId: data.team.id,
      teamName: data.team.name,
    },
  })
  await db.connections.upsert({
    where: { userId_type: { userId: user.authId, type: 'Slack' } },
    update: { slackId: savedSlack.id },
    create: {
      userId: user.authId,
      type: 'Slack',
      slackId: savedSlack.id,
    },
  })
  const result = NextResponse.redirect(connectionsUrl)
  result.cookies.delete('oauth_state_slack')
  return result
}
