import { google } from 'googleapis'
import { NextResponse } from 'next/server'
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
  
  try {
    const response = await drive.files.list()

    if (response) {
      return Response.json(
        {
          message: response.data,
        },
        {
          status: 200,
        }
      )
    } else {
      return Response.json(
        {
          message: 'No files found',
        },
        {
          status: 200,
        }
      )
    }
  } catch (error) {
    return Response.json(
      {
        message: 'Something went wrong',
      },
      {
        status: 500,
      }
    )
  }
}
