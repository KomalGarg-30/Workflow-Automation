import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getGoogleClientForUser } from '@/lib/google-oauth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const oauth2Client = await getGoogleClientForUser(user.id)
  if (!oauth2Client) {
    return NextResponse.json({ message: 'Connect Google Drive first.' }, { status: 400 })
  }

  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
  })
  
  const channelId = uuidv4()

  const startPageTokenRes = await drive.changes.getStartPageToken({})
  const startPageToken = startPageTokenRes.data.startPageToken
  if (startPageToken == null) {
    throw new Error('startPageToken is unexpectedly null')
  }

  const listener = await drive.changes.watch({
    pageToken: startPageToken,
    supportsAllDrives: true,
    supportsTeamDrives: true,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address:
        `${process.env.NGROK_URI}/api/drive-activity/notification`,
      kind: 'api#channel',
    },
  })

  if (listener.status == 200) {
    //if listener created store its channel id in db
    const channelStored = await db.user.updateMany({
      where: {
        authId: user.authId,
      },
      data: {
        googleResourceId: listener.data.resourceId,
      },
    })

    if (channelStored) {
      return new NextResponse('Listening to changes...')
    }
  }

  return new NextResponse('Oops! something went wrong, try again')
}
