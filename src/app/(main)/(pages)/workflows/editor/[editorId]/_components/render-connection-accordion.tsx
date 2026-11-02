'use client'
import React from 'react'
import ConnectionCard from '@/app/(main)/(pages)/connections/_components/connection-card'
import { AccordionContent } from '@/components/ui/accordion'
import MultipleSelector from '@/components/ui/multiple-selector'
import { Connection } from '@/lib/types'
import { useNodeConnections } from '@/providers/connections-provider'
import { EditorState } from '@/providers/editor-provider'
import { useFuzzieStore } from '@/store'

const RenderConnectionAccordion = ({
  connection,
  state,
}: {
  connection: Connection
  state: EditorState
}) => {
  const {
    title,
    image,
    description,
    connectionKey,
    slackSpecial,
  } = connection

  const { nodeConnection } = useNodeConnections()
  const { slackChannels, selectedSlackChannels, setSelectedSlackChannels } =
    useFuzzieStore()

  const isConnected =
    title === 'Telegram'
      ? Boolean(nodeConnection.telegramNode.botName)
      : title === 'Discord'
      ? Boolean(nodeConnection.discordNode.webhookURL)
      : Boolean(nodeConnection.slackNode.slackAccessToken)

  return (
    <AccordionContent key={title}>
      {state.editor.selectedNode.data.title === title && (
        <>
          <ConnectionCard
            title={title}
            icon={image}
            description={description}
            type={title}
            connected={{ [title]: isConnected }}
          />
          {slackSpecial && isConnected && (
            <div className="p-6">
              {slackChannels?.length ? (
                <>
                  <div className="mb-4 ml-1">
                    Select Slack channels for this message:
                  </div>
                  <MultipleSelector
                    value={selectedSlackChannels}
                    onChange={setSelectedSlackChannels}
                    defaultOptions={slackChannels}
                    placeholder="Select channels"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        no results found.
                      </p>
                    }
                  />
                </>
              ) : (
                'No Slack channels available. Add the Fuzzie bot to a channel, then refresh the editor.'
              )}
            </div>
          )}
        </>
      )}
    </AccordionContent>
  )
}

export default RenderConnectionAccordion
