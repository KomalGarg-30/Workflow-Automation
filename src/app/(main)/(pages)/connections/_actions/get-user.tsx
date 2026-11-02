'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const getUserData = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  return db.user.findUnique({
    where: { authId: user.authId },
    select: {
      connections: { select: { type: true } },
      LocalGoogleCredential: { select: { id: true } },
    },
  })
}
