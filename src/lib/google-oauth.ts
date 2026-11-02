import { google } from 'googleapis'
import { db } from '@/lib/db'

export function createGoogleOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } =
    process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URI) {
    throw new Error('Google OAuth environment variables are not configured.')
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI
  )
}

export async function getGoogleClientForUser(userId: number) {
  const credential = await db.localGoogleCredential.findUnique({
    where: { userId },
  })
  if (!credential) return null

  const client = createGoogleOAuthClient()
  client.setCredentials({
    access_token: credential.accessToken,
    refresh_token: credential.refreshToken || undefined,
    expiry_date: credential.expiresAt?.getTime(),
  })

  if (credential.refreshToken) {
    const token = await client.getAccessToken()
    if (token.token) {
      await db.localGoogleCredential.update({
        where: { userId },
        data: {
          accessToken: token.token,
          expiresAt: client.credentials.expiry_date
            ? new Date(client.credentials.expiry_date)
            : credential.expiresAt,
        },
      })
    }
  }

  return client
}
