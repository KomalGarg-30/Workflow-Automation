import { AccordionContent } from '@/components/ui/accordion'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import { EditorState } from '@/providers/editor-provider'
import { nodeMapper } from '@/lib/types'
import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { onContentChange } from '@/lib/editor-utils'
import ActionButton from './action-button'

export interface Option {
  value: string
  label: string
  disable?: boolean
  /** fixed option that can't be removed. */
  fixed?: boolean
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined
}
type Props = {
  nodeConnection: ConnectionProviderProps
  newState: EditorState
  selectedSlackChannels: Option[]
  setSelectedSlackChannels: (value: Option[]) => void
}

const ContentBasedOnTitle = ({
  nodeConnection,
  newState,
  selectedSlackChannels,
  setSelectedSlackChannels,
}: Props) => {
  const { selectedNode } = newState.editor
  const title = selectedNode.data.title

  const connectionKey = nodeMapper[title]
  if (!connectionKey) return <p>Select a messaging step to configure it.</p>

  const isConnected = Boolean(
    title === 'Slack'
      ? nodeConnection.slackNode.slackAccessToken
      : title === 'Discord'
      ? nodeConnection.discordNode.webhookURL
      : nodeConnection.telegramNode.botName
  )

  if (!isConnected) return <p>Not connected</p>

  return (
    <AccordionContent>
      <Card>
        {title === 'Discord' && (
          <CardHeader>
            <CardTitle>
              {nodeConnection.discordNode.webhookName}
            </CardTitle>
            <CardDescription>
              {nodeConnection.discordNode.guildName}
            </CardDescription>
          </CardHeader>
        )}
        <div className="flex flex-col gap-3 px-6 py-3 pb-20">
          <p>Message</p>

          <Input
            type="text"
            value={
              title === 'Slack'
                ? nodeConnection.slackNode.content
                : title === 'Discord'
                ? nodeConnection.discordNode.content
                : nodeConnection.telegramNode.content
            }
            onChange={(event) => onContentChange(nodeConnection, title, event)}
          />

          <ActionButton
            currentService={title}
            nodeConnection={nodeConnection}
            channels={selectedSlackChannels}
            setChannels={setSelectedSlackChannels}
          />
        </div>
      </Card>
    </AccordionContent>
  )
}

export default ContentBasedOnTitle
