import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { timingSafeEqual } from 'crypto'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const connectionsUrl = new URL('/connections', request.url)
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url))

  const [expectedState, expectedUserId] =
    request.cookies.get('oauth_state_notion')?.value?.split(':') || []
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

  const clientId = process.env.NOTION_CLIENT_ID
  const clientSecret = process.env.NOTION_API_SECRET
  const redirectUri = process.env.NOTION_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Notion OAuth environment variables are not configured.')
  }

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await axios.post(
    'https://api.notion.com/v1/oauth/token',
    {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encoded}`,
        'Notion-Version': '2022-06-28',
      },
    }
  )

  const notionClient = new Client({ auth: response.data.access_token })
  const databases = await notionClient.search({
    filter: { value: 'database', property: 'object' },
    sort: { direction: 'ascending', timestamp: 'last_edited_time' },
  })
  const databaseId = databases.results[0]?.id || ''
  const notion = await db.notion.findFirst({
    where: { userId: user.authId, workspaceId: response.data.workspace_id },
    select: { id: true },
  })

  let savedNotion
  if (notion) {
    savedNotion = await db.notion.update({
      where: { id: notion.id },
      data: {
        accessToken: response.data.access_token,
        workspaceIcon: response.data.workspace_icon || '',
        workspaceName: response.data.workspace_name,
        databaseId,
      },
    })
  } else {
    savedNotion = await db.notion.create({
      data: {
        userId: user.authId,
        accessToken: response.data.access_token,
        workspaceId: response.data.workspace_id,
        workspaceName: response.data.workspace_name,
        workspaceIcon: response.data.workspace_icon || '',
        databaseId,
      },
    })
  }

  await db.connections.upsert({
    where: { userId_type: { userId: user.authId, type: 'Notion' } },
    update: { notionId: savedNotion.id },
    create: {
      userId: user.authId,
      type: 'Notion',
      notionId: savedNotion.id,
    },
  })
  const result = NextResponse.redirect(connectionsUrl)
  result.cookies.delete('oauth_state_notion')
  return result
}
