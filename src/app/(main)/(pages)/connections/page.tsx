import { CONNECTIONS } from '@/lib/constant'
import React from 'react'
import ConnectionCard from './_components/connection-card'
import { getUserData } from './_actions/get-user'

const Connections = async () => {
  const user_info = await getUserData()
  const connections: Record<string, boolean> = {}
  user_info?.connections.forEach((connection) => {
    connections[connection.type] = true
  })
  connections.Telegram = Boolean(user_info?.TelegramBot)

  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Connections
      </h1>
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 p-6 text-muted-foreground">
          Connect all your apps directly from here. You may need to connect
          these apps regularly to refresh verification
          {CONNECTIONS.map((connection) => (
            <ConnectionCard
              key={connection.title}
              description={connection.description}
              title={connection.title}
              icon={connection.image}
              type={connection.title}
              connected={connections}
              showTelegramForm={connection.title === 'Telegram'}
            />
          ))}
        </section>
      </div>
    </div>
  )
}

export default Connections
