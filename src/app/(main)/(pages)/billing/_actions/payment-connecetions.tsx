'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const onPaymentDetails = async () => {
  const user = await getCurrentUser()

  if (user) {
    const connection = await db.user.findFirst({
      where: {
        authId: user.authId,
      },
      select: {
        tier: true,
        credits: true,
      },
    })

    if (user) {
      return connection
    }
  }
}
