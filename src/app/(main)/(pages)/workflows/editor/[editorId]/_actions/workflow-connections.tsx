'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendTelegramMessage } from '@/lib/telegram'

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string
) => {
  const user = await getCurrentUser()
  if (!user) return

  const flow = await db.workflows.updateMany({
    where: { id: flowId, userId: user.authId },
    data: {
      nodes,
      edges,
    },
  })

  if (flow.count) return { message: 'flow saved' }
}

export const onRunDiscordWorkflow = async (workflowId: string) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to run this workflow.' }

  const workflow = await db.workflows.findFirst({
    where: { id: workflowId, userId: user.authId },
    select: { nodes: true, discordTemplate: true },
  })
  if (!workflow) return { error: 'Workflow not found.' }

  let nodes: unknown
  try {
    nodes = JSON.parse(workflow.nodes || '[]')
  } catch {
    return { error: 'Save the workflow before running it.' }
  }
  if (
    !Array.isArray(nodes) ||
    !nodes.some(
      (node) =>
        typeof node === 'object' &&
        node !== null &&
        'type' in node &&
        node.type === 'Discord'
    )
  ) {
    return { error: 'Add a Discord step to this workflow first.' }
  }

  const message = workflow.discordTemplate?.trim()
  if (!message) return { error: 'Enter and save a Discord message first.' }
  if (message.length > 2000) {
    return { error: 'Discord messages must be 2000 characters or fewer.' }
  }

  const webhook = await db.discordWebhook.findFirst({
    where: { userId: user.authId },
    select: { url: true },
  })
  if (!webhook) {
    return { error: 'Connect Discord before running this workflow.' }
  }

  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  })
  if (!response.ok) {
    return { error: `Discord rejected the message (HTTP ${response.status}).` }
  }

  return { message: 'Discord message sent successfully.' }
}

export const onRunTelegramWorkflow = async (workflowId: string) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to run this workflow.' }

  const workflow = await db.workflows.findFirst({
    where: { id: workflowId, userId: user.authId },
    select: { nodes: true, telegramTemplate: true },
  })
  if (!workflow) return { error: 'Workflow not found.' }

  let nodes: unknown
  try {
    nodes = JSON.parse(workflow.nodes || '[]')
  } catch {
    return { error: 'Save the workflow before running it.' }
  }
  if (
    !Array.isArray(nodes) ||
    !nodes.some(
      (node) =>
        typeof node === 'object' &&
        node !== null &&
        'type' in node &&
        node.type === 'Telegram'
    )
  ) {
    return { error: 'Add a Telegram step to this workflow first.' }
  }

  const message = workflow.telegramTemplate?.trim()
  if (!message) return { error: 'Enter and save a Telegram message first.' }

  const bot = await db.telegramBot.findUnique({
    where: { userId: user.authId },
    select: { botToken: true, chatId: true },
  })
  if (!bot) return { error: 'Connect Telegram before running this workflow.' }

  return sendTelegramMessage(bot.botToken, bot.chatId, message)
}
