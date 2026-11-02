type TelegramResponse = {
  ok: boolean
  description?: string
}

export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
) => {
  if (!message.trim()) return { error: 'Enter a Telegram message first.' }
  if (message.length > 4096) {
    return { error: 'Telegram messages must be 4096 characters or fewer.' }
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    }
  )
  const result = (await response.json()) as TelegramResponse
  if (!response.ok || !result.ok) {
    return {
      error:
        result.description ||
        `Telegram rejected the message (HTTP ${response.status}).`,
    }
  }

  return { message: 'Telegram message sent successfully.' }
}
