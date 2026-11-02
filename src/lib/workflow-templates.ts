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

const createNode = (
  id: string,
  type: EditorCanvasTypes,
  x: number,
  description: string
): EditorNodeType => ({
  id,
  type,
  position: { x, y: 120 },
  data: {
    title: type,
    description,
    completed: false,
    current: false,
    metadata: {},
    type,
  },
})

const createDriveNotificationTemplate = (
  id: string,
  name: string,
  description: string,
  integration: Integration
): WorkflowTemplate => ({
  id,
  name,
  description,
  integrations: [
    { name: 'Google Drive', image: '/googleDrive.png' },
    integration,
  ],
  nodes: [
    createNode(
      `${id}-trigger`,
      'Google Drive',
      80,
      'Watch a connected Google Drive folder for changes.'
    ),
    createNode(
      `${id}-action`,
      integration.name,
      440,
      `Send a notification using ${integration.name}. Configure this action in the editor.`
    ),
  ],
  edges: [
    {
      id: `${id}-trigger-to-action`,
      source: `${id}-trigger`,
      target: `${id}-action`,
    },
  ],
})

export const workflowTemplates: WorkflowTemplate[] = [
  createDriveNotificationTemplate(
    'drive-to-slack',
    'Google Drive to Slack',
    'Start with a Drive folder trigger and a Slack notification action.',
    { name: 'Slack', image: '/slack.png' }
  ),
  createDriveNotificationTemplate(
    'drive-to-discord',
    'Google Drive to Discord',
    'Notify a Discord channel when your connected Drive folder changes.',
    { name: 'Discord', image: '/discord.png' }
  ),
  createDriveNotificationTemplate(
    'drive-to-telegram',
    'Google Drive to Telegram',
    'Notify a Telegram chat when your connected Drive folder changes.',
    { name: 'Telegram', image: '/telegram.svg' }
  ),
  {
    id: 'drive-to-notion',
    name: 'Google Drive to Notion',
    description:
      'Start with a Drive folder trigger and a Notion action for your workspace.',
    integrations: [
      { name: 'Google Drive', image: '/googleDrive.png' },
      { name: 'Notion', image: '/notion.png' },
    ],
    nodes: [
      createNode(
        'drive-to-notion-trigger',
        'Google Drive',
        80,
        'Watch a connected Google Drive folder for changes.'
      ),
      createNode(
        'drive-to-notion-action',
        'Notion',
        440,
        'Create a Notion entry. Configure this action in the editor.'
      ),
    ],
    edges: [
      {
        id: 'drive-to-notion-trigger-to-action',
        source: 'drive-to-notion-trigger',
        target: 'drive-to-notion-action',
      },
    ],
  },
]
