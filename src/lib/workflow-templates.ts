import { EditorCanvasTypes, EditorNodeType } from '@/lib/types'

type Integration = {
  name: EditorCanvasTypes
  image: string
}

export type WorkflowTemplate = {
  id: string
  name: string
  description: string
  integrations: Integration[]
  nodes: EditorNodeType[]
  edges: { id: string; source: string; target: string }[]
}

const createMessagingTemplate = (
  id: string,
  name: string,
  description: string,
  integration: Integration
): WorkflowTemplate => {
  const node: EditorNodeType = {
    id: `${id}-action`,
    type: integration.name,
    position: { x: 240, y: 120 },
    data: {
      title: integration.name,
      description: `Send a message using ${integration.name}. Configure it in the editor.`,
      completed: false,
      current: false,
      metadata: {},
      type: integration.name,
    },
  }

  return {
    id,
    name,
    description,
    integrations: [integration],
    nodes: [node],
    edges: [],
  }
}

export const workflowTemplates: WorkflowTemplate[] = [
  createMessagingTemplate(
    'slack-message',
    'Send a Slack message',
    'Start with a Slack message step and choose a channel in the editor.',
    { name: 'Slack', image: '/slack.png' }
  ),
  createMessagingTemplate(
    'discord-message',
    'Send a Discord message',
    'Start with a Discord message step and configure its content in the editor.',
    { name: 'Discord', image: '/discord.png' }
  ),
  createMessagingTemplate(
    'telegram-message',
    'Send a Telegram message',
    'Start with a Telegram message step and configure its content in the editor.',
    { name: 'Telegram', image: '/telegram.svg' }
  ),
]
