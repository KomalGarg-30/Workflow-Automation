'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { connectTelegramBot } from '../_actions/telegram-connection'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TelegramConnectionForm = ({ connected }: { connected: boolean }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsConnecting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      const result = await connectTelegramBot(
        String(formData.get('botToken') || ''),
        String(formData.get('chatId') || '')
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Telegram connected successfully.')
        form.reset()
        router.refresh()
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to connect Telegram. Please try again.'
      )
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-64 flex-col gap-2">
      <Input
        name="botToken"
        type="password"
        autoComplete="off"
        aria-label="Telegram bot token"
        placeholder="Telegram bot token"
        required
      />
      <Input
        name="chatId"
        aria-label="Telegram chat ID"
        placeholder="Chat ID or @channel"
        required
      />
      <Button type="submit" disabled={isConnecting}>
        {isConnecting
          ? 'Connecting…'
          : connected
          ? 'Update connection'
          : 'Connect Telegram'}
      </Button>
    </form>
  )
}

export default TelegramConnectionForm
