'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import axios from 'axios'

export const getDiscordConnectionUrl = async () => {
  const user = await getCurrentUser()
  if (user) {
    const webhook = await db.discordWebhook.findFirst({
      where: {
        userId: user.authId,
      },
      select: {
        url: true,
        name: true,
        guildName: true,
      },
    })

    return webhook
  }
}

export const postContentToWebHook = async (content: string, url: string) => {
  console.log(content)
  if (content != '') {
    const posted = await axios.post(url, { content })
    if (posted) {
      return { message: 'success' }
    }
    return { message: 'failed request' }
  }
  return { message: 'String empty' }
}
