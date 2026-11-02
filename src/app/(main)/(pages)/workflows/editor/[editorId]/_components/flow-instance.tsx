'use client'
import { Button } from '@/components/ui/button'
import { useNodeConnections } from '@/providers/connections-provider'
import { usePathname } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import {
  onCreateNodesEdges,
  onRunDiscordWorkflow,
  onRunTelegramWorkflow,
} from '../_actions/workflow-connections'
import { toast } from 'sonner'
import { onCreateNodeTemplate } from '../../../_actions/workflow-connections'

type Props = {
  children: React.ReactNode
  edges: any[]
  nodes: any[]
}

const FlowInstance = ({ children, edges, nodes }: Props) => {
  const pathname = usePathname()
  const [isRunning, setIsRunning] = useState(false)
  const { nodeConnection } = useNodeConnections()
  const workflowId = pathname.split('/').pop()!
  const hasDiscordNode = nodes.some((node) => node.type === 'Discord')
  const hasTelegramNode = nodes.some((node) => node.type === 'Telegram')
  const [isTelegramRunning, setIsTelegramRunning] = useState(false)
  const isSending = isRunning || isTelegramRunning

  const onFlowAutomation = useCallback(async () => {
    const flow = await onCreateNodesEdges(
      workflowId,
      JSON.stringify(nodes),
      JSON.stringify(edges)
    )

    if (flow) toast.message(flow.message)
  }, [edges, nodes, workflowId])

  const onRunDiscord = async () => {
    setIsRunning(true)
    try {
      const flow = await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges)
      )
      if (!flow) {
        toast.error('Unable to save the workflow before running it.')
        return
      }

      const template = await onCreateNodeTemplate(
        nodeConnection.discordNode.content,
        'Discord',
        workflowId
      )
      if (template !== 'Discord template saved') {
        toast.error('Unable to save the Discord message.')
        return
      }

      const result = await onRunDiscordWorkflow(workflowId)
      if ('error' in result) {
        toast.error(result.error)
      } else if ('message' in result) {
        toast.success(result.message)
      }
    } catch {
      toast.error('Unable to run the Discord workflow. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  const onRunTelegram = async () => {
    setIsTelegramRunning(true)
    try {
      const flow = await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges)
      )
      if (!flow) {
        toast.error('Unable to save the workflow before running it.')
        return
      }

      const template = await onCreateNodeTemplate(
        nodeConnection.telegramNode.content,
        'Telegram',
        workflowId
      )
      if (template !== 'Telegram template saved') {
        toast.error('Unable to save the Telegram message.')
        return
      }

      const result = await onRunTelegramWorkflow(workflowId)
      if ('error' in result) {
        toast.error(result.error)
      } else if ('message' in result) {
        toast.success(result.message)
      }
    } catch {
      toast.error('Unable to run the Telegram workflow. Please try again.')
    } finally {
      setIsTelegramRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 p-4">
        <Button
          onClick={onFlowAutomation}
          disabled={nodes.length < 1}
        >
          Save
        </Button>
        <Button
          variant="outline"
          onClick={onRunDiscord}
          disabled={!hasDiscordNode || isSending}
        >
          {isRunning ? 'Sending…' : 'Run Discord'}
        </Button>
        <Button
          variant="outline"
          onClick={onRunTelegram}
          disabled={!hasTelegramNode || isSending}
        >
          {isTelegramRunning ? 'Sending…' : 'Run Telegram'}
        </Button>
      </div>
      {children}
    </div>
  )
}

export default FlowInstance
