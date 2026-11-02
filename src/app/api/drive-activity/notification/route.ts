import { postContentToWebHook } from '@/app/(main)/(pages)/connections/_actions/discord-connection'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { postMessageToSlack } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { sendTelegramMessage } from '@/lib/telegram'
import { db } from '@/lib/db'
import axios from 'axios'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('🔴 Changed')
  const headersList = headers()
  let channelResourceId
  headersList.forEach((value, key) => {
    if (key == 'x-goog-resource-id') {
      channelResourceId = value
    }
  })

  if (channelResourceId) {
    const user = await db.user.findFirst({
      where: {
        googleResourceId: channelResourceId,
      },
      select: { authId: true, credits: true },
    })
    if ((user && parseInt(user.credits!) > 0) || user?.credits == 'Unlimited') {
      const workflow = await db.workflows.findMany({
        where: {
          userId: user.authId,
        },
      })
      if (workflow) {
        await Promise.all(workflow.map(async (flow) => {
          const flowPath = JSON.parse(flow.flowPath!)
          let current = 0
          while (current < flowPath.length) {
            if (flowPath[current] == 'Discord') {
              const discordMessage = await db.discordWebhook.findFirst({
                where: {
                  userId: flow.userId,
                },
                select: {
                  url: true,
                },
              })
              if (discordMessage) {
                await postContentToWebHook(
                  flow.discordTemplate!,
                  discordMessage.url
                )
                flowPath.splice(current, 1)
                current--
              }
            }
            if (flowPath[current] == 'Telegram') {
              const telegramBot = await db.telegramBot.findUnique({
                where: { userId: flow.userId },
                select: { botToken: true, chatId: true },
              })
              if (telegramBot && flow.telegramTemplate) {
                await sendTelegramMessage(
                  telegramBot.botToken,
                  telegramBot.chatId,
                  flow.telegramTemplate
                )
                flowPath.splice(current, 1)
                current--
              }
            }
            if (flowPath[current] == 'Slack') {
              const channels = flow.slackChannels.map((channel) => {
                return {
                  label: '',
                  value: channel,
                }
              })
              await postMessageToSlack(
                flow.slackAccessToken!,
                channels,
                flow.slackTemplate!
              )
              flowPath.splice(current, 1)
              current--
            }
            if (flowPath[current] == 'Notion') {
              await onCreateNewPageInDatabase(
                flow.notionDbId!,
                flow.notionAccessToken!,
                JSON.parse(flow.notionTemplate!)
              )
              flowPath.splice(current, 1)
              current--
            }

            if (flowPath[current] == 'Wait') {
              const res = await axios.put(
                'https://api.cron-job.org/jobs',
                {
                  job: {
                    url: `${process.env.NGROK_URI}?flow_id=${flow.id}`,
                    enabled: 'true',
                    schedule: {
                      timezone: 'Europe/Istanbul',
                      expiresAt: 0,
                      hours: [-1],
                      mdays: [-1],
                      minutes: ['*****'],
                      months: [-1],
                      wdays: [-1],
                    },
                  },
                },
                {
                  headers: {
                    Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
                    'Content-Type': 'application/json',
                  },
                }
              )
              if (res) {
                flowPath.splice(current, 1)
                const cronPath = await db.workflows.update({
                  where: {
                    id: flow.id,
                  },
                  data: {
                    cronPath: JSON.stringify(flowPath),
                  },
                })
                if (cronPath) break
              }
              break
            }
            current++
          }

         await db.user.update({
            where: {
              authId: user.authId,
            },
            data: {
              credits: `${parseInt(user.credits!) - 1}`,
            },
          })
        }))
        return Response.json(
          {
            message: 'flow completed',
          },
          {
            status: 200,
          }
        )
      }
    }
  }
  return Response.json(
    {
      message: 'success',
    },
    {
      status: 200,
    }
  )
}
