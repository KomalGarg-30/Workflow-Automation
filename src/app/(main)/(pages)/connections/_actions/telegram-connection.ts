'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendTelegramMessage } from '@/lib/telegram'

type TelegramResponse = {
  ok: boolean
  result?: {
    id?: number
    username?: string
    first_name?: string
    title?: string
  }
  description?: string
}

export const connectTelegramBot = async (botToken: string, chatId: string) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to connect Telegram.' }

  const token = botToken.trim()
  const destination = chatId.trim()
  if (!token || !destination) {
    return { error: 'Enter both a bot token and a chat ID.' }
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
  const result = (await response.json()) as TelegramResponse
  if (!response.ok || !result.ok || !result.result) {
    return { error: 'Telegram could not verify that bot token.' }
  }

  const chatResponse = await fetch(
    `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(destination)}`
  )
  const chatResult = (await chatResponse.json()) as TelegramResponse
  if (!chatResponse.ok || !chatResult.ok || !chatResult.result) {
    return {
      error:
        'Telegram could not access that chat. Start the bot in a private chat or add it to the group/channel first.',
    }
  }

  const botName =
    result.result.username || result.result.first_name || 'Telegram bot'
  await db.telegramBot.upsert({
    where: { userId: user.authId },
    create: {
      botToken: token,
      chatId: destination,
      botName,
      userId: user.authId,
    },
    update: {
      botToken: token,
      chatId: destination,
      botName,
    },
  })

  return { message: 'Telegram connected successfully.' }
}

export const getTelegramConnection = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  return db.telegramBot.findUnique({
    where: { userId: user.authId },
    select: { chatId: true, botName: true },
  })
}

export const sendTelegramTestMessage = async (message: string) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to send a Telegram message.' }

  const connection = await db.telegramBot.findUnique({
    where: { userId: user.authId },
    select: { botToken: true, chatId: true },
  })
  if (!connection) return { error: 'Connect Telegram before sending a message.' }

  return sendTelegramMessage(connection.botToken, connection.chatId, message)
}
