import Link from 'next/link'
import { ArrowRight, MessagesSquare, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WorkflowButton from '../workflows/_components/workflow-button'
import { onGetWorkflows } from '../workflows/_actions/workflow-connections'
import { getCurrentUser } from '@/lib/auth'
import { getUserData } from '../connections/_actions/get-user'

export default async function DashboardPage() {
  const [user, workflows, connectionData] = await Promise.all([
    getCurrentUser(),
    onGetWorkflows(),
    getUserData(),
  ])
  const userWorkflows = workflows ?? []
  const connectedMessagingApps =
    (connectionData?.connections.filter((connection) =>
      ['Discord', 'Slack'].includes(connection.type)
    ).length || 0) + Number(Boolean(connectionData?.TelegramBot))

  return (
    <div className="relative flex flex-col gap-6 pb-8">
      <header className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Here&apos;s your
            messaging workflow overview.
          </p>
        </div>
        <WorkflowButton />
      </header>

      <section className="grid gap-4 px-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total workflows
            </CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userWorkflows.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Workflows in your account
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected messaging apps
            </CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{connectedMessagingApps}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Discord, Slack, and Telegram connections
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 px-6 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your workflows</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/workflows">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {userWorkflows.length ? (
              <ul className="divide-y">
                {userWorkflows.slice(0, 5).map((workflow) => (
                  <li
                    key={workflow.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/workflows/editor/${workflow.id}`}
                        className="font-medium hover:underline"
                      >
                        {workflow.name}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                      <Workflow className="h-4 w-4" />
                      Workflow
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Workflow className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No workflows yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Create a workflow from scratch or start with a ready-made
                  template.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link href="/templates">Browse templates</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/workflows">Go to workflows</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/templates">
                Explore templates <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link href="/connections">
                Connect your apps <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="pt-2 text-sm text-muted-foreground">
              Connect a messaging app, configure a message, then send it from
              your workflow.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
