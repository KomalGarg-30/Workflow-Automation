'use server'
import { Option } from '@/components/ui/multiple-selector'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { workflowTemplates } from '@/lib/workflow-templates'

export const getGoogleListener = async () => {
  const user = await getCurrentUser()

  if (user) {
    const listener = await db.user.findUnique({
      where: {
        authId: user.authId,
      },
      select: {
        googleResourceId: true,
      },
    })

    if (listener) return listener
  }
}

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  const user = await getCurrentUser()
  if (!user) return 'Please sign in'
  const workflow = await db.workflows.findFirst({
    where: { id: workflowId, userId: user.authId },
    select: { id: true },
  })
  if (!workflow) return 'Workflow not found'

  const published = await db.workflows.update({
    where: { id: workflow.id },
    data: {
      publish: state,
    },
  })

  if (published.publish) return 'Workflow published'
  return 'Workflow unpublished'
}

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string
) => {
  const user = await getCurrentUser()
  if (!user) return
  const ownedWorkflow = await db.workflows.findFirst({
    where: { id: workflowId, userId: user.authId },
    select: { id: true },
  })
  if (!ownedWorkflow) return

  if (type === 'Discord') {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        discordTemplate: content,
      },
    })

    if (response) return 'Discord template saved'
  }
  if (type === 'Telegram') {
    const response = await db.workflows.update({
      where: { id: workflowId },
      data: { telegramTemplate: content },
    })

    if (response) return 'Telegram template saved'
  }
  if (type === 'Slack') {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        slackTemplate: content,
        slackAccessToken: accessToken,
      },
    })

    if (response) {
      const channelList = await db.workflows.findUnique({
        where: {
          id: workflowId,
        },
        select: {
          slackChannels: true,
        },
      })

      if (channelList) {
        //remove duplicates before insert
        const NonDuplicated = channelList.slackChannels.filter(
          (channel) => channel !== channels![0].value
        )

        NonDuplicated!
          .map((channel) => channel)
          .forEach(async (channel) => {
            await db.workflows.update({
              where: {
                id: workflowId,
              },
              data: {
                slackChannels: {
                  push: channel,
                },
              },
            })
          })

        return 'Slack template saved'
      }
      channels!
        .map((channel) => channel.value)
        .forEach(async (channel) => {
          await db.workflows.update({
            where: {
              id: workflowId,
            },
            data: {
              slackChannels: {
                push: channel,
              },
            },
          })
        })
      return 'Slack template saved'
    }
  }

  if (type === 'Notion') {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        notionTemplate: content,
        notionAccessToken: accessToken,
        notionDbId: notionDbId,
      },
    })

    if (response) return 'Notion template saved'
  }
}

export const onGetWorkflows = async () => {
  const user = await getCurrentUser()
  if (user) {
    const workflow = await db.workflows.findMany({
      where: {
        userId: user.authId,
      },
    })

    if (workflow) return workflow
  }
}

export const onCreateWorkflow = async (name: string, description: string) => {
  const user = await getCurrentUser()

  if (user) {
    //create new workflow
    const workflow = await db.workflows.create({
      data: {
        userId: user.authId,
        name,
        description,
      },
    })

    if (workflow) return { message: 'workflow created' }
    return { message: 'Oops! try again' }
  }
}

export const onCreateWorkflowFromTemplate = async (templateId: string) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to use a workflow template.' }

  const template = workflowTemplates.find(({ id }) => id === templateId)
  if (!template) return { error: 'That workflow template is not available.' }

  const workflow = await db.workflows.create({
    data: {
      userId: user.authId,
      name: template.name,
      description: template.description,
      nodes: JSON.stringify(template.nodes),
      edges: JSON.stringify(template.edges),
    },
    select: { id: true },
  })

  return { id: workflow.id }
}

export const onGetNodesEdges = async (flowId: string) => {
  const user = await getCurrentUser()
  if (!user) return
  const nodesEdges = await db.workflows.findUnique({
    where: {
      id: flowId,
      userId: user.authId,
    },
    select: {
      nodes: true,
      edges: true,
    },
  })
  if (nodesEdges?.nodes && nodesEdges?.edges) return nodesEdges
}
