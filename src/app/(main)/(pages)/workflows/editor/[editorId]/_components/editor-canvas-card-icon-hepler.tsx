'use client'
import React from 'react'
import { MessagesSquare, Send, Slack } from 'lucide-react'
import { EditorCanvasTypes } from '@/lib/types'

type Props = { type: EditorCanvasTypes }

const EditorCanvasIconHelper = ({ type }: Props) => {
  switch (type) {
    case 'Slack':
      return (
        <Slack
          className="flex-shrink-0"
          size={30}
        />
      )
    case 'Discord':
      return (
        <MessagesSquare
          className="flex-shrink-0"
          size={30}
        />
      )
    case 'Telegram':
      return (
        <Send
          className="flex-shrink-0"
          size={30}
        />
      )
    default:
      return (
        <MessagesSquare
          className="flex-shrink-0"
          size={30}
        />
      )
  }
}

export default EditorCanvasIconHelper
