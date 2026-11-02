import React from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  name: string
  description: string
  id: string
}

const Workflow = ({ description, id, name }: Props) => {
  return (
    <Card className="flex w-full items-center justify-between">
      <CardHeader className="flex flex-col gap-4">
        <Link href={`/workflows/editor/${id}`}>
          <div className="flex flex-row gap-2">
            <Image
              src="/discord.png"
              alt="Discord"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src="/slack.png"
              alt="Slack"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src="/telegram.svg"
              alt="Telegram"
              height={30}
              width={30}
              className="object-contain"
            />
          </div>
          <div className="">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </Link>
      </CardHeader>
    </Card>
  )
}

export default Workflow
