import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { timingSafeEqual } from 'crypto'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const connectionsUrl = new URL('/connections', request.url)
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const [expectedState, expectedUserId] =
    request.cookies.get('oauth_state_discord')?.value?.split(':') || []
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

  const redirectUri = `${process.env.NEXT_PUBLIC_URL || request.nextUrl.origin}/api/auth/callback/discord`
  const tokenData = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  })

  const tokenResponse = await axios.post(
    'https://discord.com/api/oauth2/token',
    tokenData,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  const webhook = tokenResponse.data.webhook
  const accessToken = tokenResponse.data.access_token
  if (!webhook || !accessToken) {
    throw new Error('Discord OAuth did not return an incoming webhook.')
  }

  const guildResponse = await axios.get(
    'https://discord.com/api/users/@me/guilds',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const guild = guildResponse.data.find(
    (item: { id: string }) => item.id === webhook.guild_id
  )
  if (!guild) throw new Error('The Discord webhook guild was not returned.')

  const existing = await db.discordWebhook.findUnique({
    where: { webhookId: webhook.id },
  })
  if (existing && existing.userId !== user.authId) {
    throw new Error('This Discord webhook is already linked to another account.')
  }

  const savedWebhook = await db.discordWebhook.upsert({
    where: { webhookId: webhook.id },
    update: {
      userId: user.authId,
      channelId: webhook.channel_id,
      guildId: webhook.guild_id,
      name: webhook.name,
      url: webhook.url,
      guildName: guild.name,
    },
    create: {
      userId: user.authId,
      webhookId: webhook.id,
      channelId: webhook.channel_id,
      guildId: webhook.guild_id,
      name: webhook.name,
      url: webhook.url,
      guildName: guild.name,
    },
  })
  await db.connections.upsert({
    where: { userId_type: { userId: user.authId, type: 'Discord' } },
    update: { discordWebhookId: savedWebhook.id },
    create: {
      userId: user.authId,
      type: 'Discord',
      discordWebhookId: savedWebhook.id,
    },
  })

  const response = NextResponse.redirect(connectionsUrl)
  response.cookies.delete('oauth_state_discord')
  return response
}
