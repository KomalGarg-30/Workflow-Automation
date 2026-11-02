'use server'
import { google } from 'googleapis'
import { getCurrentUser } from '@/lib/auth'
import { getGoogleClientForUser } from '@/lib/google-oauth'

export const getFileMetaData = async () => {
  const user = await getCurrentUser()
  if (!user) {
    return { message: 'User not found' }
  }

  const oauth2Client = await getGoogleClientForUser(user.id)
  if (!oauth2Client) return { message: 'Connect Google Drive first.' }

  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  const response = await drive.files.list()

  if (response) {
    return response.data
  }
}
