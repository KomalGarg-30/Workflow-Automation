'use client'
import { Button } from '@/components/ui/button'
import { useNodeConnections } from '@/providers/connections-provider'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import {
  onCreateNodesEdges,
  onFlowPublish,
  onRunDiscordWorkflow,
} from '../_actions/workflow-connections'
import { toast } from 'sonner'
import { onCreateNodeTemplate } from '../../../_actions/workflow-connections'

type Props = {
  children: React.ReactNode
  edges: any[]
  nodes: any[]
}

const getFlowPath = (nodes: Props['nodes'], edges: Props['edges']) =>
  edges.flatMap((edge) => {
    const target = nodes.find((node) => node.id === edge.target)
    return target ? [target.type] : []
  })

const FlowInstance = ({ children, edges, nodes }: Props) => {
  const pathname = usePathname()
  const [isFlow, setIsFlow] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const { nodeConnection } = useNodeConnections()
  const workflowId = pathname.split('/').pop()!
  const hasDiscordNode = nodes.some((node) => node.type === 'Discord')

  const onFlowAutomation = useCallback(async () => {
    const flow = await onCreateNodesEdges(
      workflowId,
      JSON.stringify(nodes),
      JSON.stringify(edges),
      JSON.stringify(getFlowPath(nodes, edges))
    )

    if (flow) toast.message(flow.message)
  }, [edges, nodes, workflowId])

  const onPublishWorkflow = useCallback(async () => {
    const response = await onFlowPublish(workflowId, true)
    if (response) toast.message(response)
  }, [workflowId])

  const onRunDiscord = async () => {
    setIsRunning(true)
    try {
      const flow = await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        JSON.stringify(getFlowPath(nodes, edges))
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
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message)
      }
    } catch {
      toast.error('Unable to run the Discord workflow. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  const onAutomateFlow = async () => {
    const flows: any = []
    const connectedEdges = edges.map((edge) => edge.target)
    connectedEdges.map((target) => {
      nodes.map((node) => {
        if (node.id === target) {
          flows.push(node.type)
        }
      })
    })

    setIsFlow(flows)
  }

  useEffect(() => {
    onAutomateFlow()
  }, [edges])

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
          disabled={!hasDiscordNode || isRunning}
        >
          {isRunning ? 'Sending…' : 'Run Discord'}
        </Button>
        <Button
          disabled={isFlow.length < 1}
          onClick={onPublishWorkflow}
        >
          Publish
        </Button>
      </div>
      {children}
    </div>
  )
}

export default FlowInstance
