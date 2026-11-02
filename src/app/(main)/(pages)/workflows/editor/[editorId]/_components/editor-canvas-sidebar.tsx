'use client'
import { useNodeConnections } from '@/providers/connections-provider'
import { useEditor } from '@/providers/editor-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import React, { useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { CONNECTIONS, EditorCanvasDefaultCardTypes } from '@/lib/constant'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  fetchBotSlackChannels,
  onConnections,
  onDragStart,
} from '@/lib/editor-utils'
import EditorCanvasIconHelper from './editor-canvas-card-icon-hepler'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import RenderConnectionAccordion from './render-connection-accordion'
import RenderOutputAccordion from './render-output-accordian'
import { useFuzzieStore } from '@/store'
import { toast } from 'sonner'

type Props = {
  onAddNode: (type: keyof typeof EditorCanvasDefaultCardTypes) => void
}

const EditorCanvasSidebar = ({ onAddNode }: Props) => {
  const { state } = useEditor()
  const { nodeConnection } = useNodeConnections()
  const { setSlackChannels } = useFuzzieStore()
  const selectedNodeTitle = state.editor.selectedNode.data.title

  useEffect(() => {
    let active = true
    const loadConnection = async () => {
      try {
        await onConnections(
          {
            setDiscordNode: nodeConnection.setDiscordNode,
            setTelegramNode: nodeConnection.setTelegramNode,
            setSlackNode: nodeConnection.setSlackNode,
          },
          selectedNodeTitle
        )
      } catch {
        if (active) toast.error('Unable to load the selected app connection.')
      }
    }

    if (selectedNodeTitle) {
      void loadConnection()
    }

    return () => {
      active = false
    }
  }, [
    selectedNodeTitle,
    nodeConnection.setDiscordNode,
    nodeConnection.setTelegramNode,
    nodeConnection.setSlackNode,
  ])

  useEffect(() => {
    const token = nodeConnection.slackNode.slackAccessToken
    if (!token) {
      setSlackChannels([])
      return
    }

    let active = true
    fetchBotSlackChannels(token, (channels) => {
      if (active) setSlackChannels(channels)
    }).catch(() => {
      if (active) toast.error('Unable to load Slack channels.')
    })

    return () => {
      active = false
    }
  }, [nodeConnection.slackNode.slackAccessToken, setSlackChannels])

  return (
    <aside>
      <Tabs
        defaultValue="actions"
        className="h-screen overflow-scroll pb-24"
      >
        <TabsList className="bg-transparent">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent
          value="actions"
          className="flex flex-col gap-4 p-4"
        >
          <p className="text-sm text-muted-foreground">
            Click or drag a step onto the canvas.
          </p>
          {Object.entries(EditorCanvasDefaultCardTypes).map(
            ([cardKey, cardValue]) => (
              <Card
                key={cardKey}
                draggable
                role="button"
                tabIndex={0}
                aria-label={`Add ${cardKey} step`}
                className="w-full cursor-pointer border-black bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
                onClick={() =>
                  onAddNode(cardKey as keyof typeof EditorCanvasDefaultCardTypes)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onAddNode(
                      cardKey as keyof typeof EditorCanvasDefaultCardTypes
                    )
                  }
                }}
                onDragStart={(event) =>
                  onDragStart(
                    event,
                    cardKey as keyof typeof EditorCanvasDefaultCardTypes
                  )
                }
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <EditorCanvasIconHelper
                    type={cardKey as keyof typeof EditorCanvasDefaultCardTypes}
                  />
                  <CardTitle className="text-md">
                    {cardKey}
                    <CardDescription>{cardValue.description}</CardDescription>
                  </CardTitle>
                </CardHeader>
              </Card>
            )
          )}
        </TabsContent>
        <TabsContent
          value="settings"
          className="-mt-6"
        >
          <div className="px-2 py-4 text-center text-xl font-bold">
            {state.editor.selectedNode.data.title}
          </div>

          <Accordion type="multiple">
            <AccordionItem
              value="Options"
              className="border-y-[1px] px-2"
            >
              <AccordionTrigger className="!no-underline">
                Account
              </AccordionTrigger>
              <AccordionContent>
                {CONNECTIONS.map((connection) => (
                  <RenderConnectionAccordion
                    key={connection.title}
                    state={state}
                    connection={connection}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="Expected Output"
              className="px-2"
            >
              <AccordionTrigger className="!no-underline">
                Action
              </AccordionTrigger>
              <RenderOutputAccordion
                state={state}
                nodeConnection={nodeConnection}
              />
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export default EditorCanvasSidebar
