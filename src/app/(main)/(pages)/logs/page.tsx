import Link from 'next/link'
import { Clock3, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LogsPage() {
  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Logs
      </h1>
      <section className="flex flex-col gap-4 p-6">
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader className="items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Clock3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Workflow run history is not available yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <p className="max-w-lg text-sm text-muted-foreground">
              This app does not record workflow execution history yet, so there
              are no run logs to show here.
            </p>
            <Button asChild variant="outline">
              <Link href="/workflows">
                <Workflow className="mr-2 h-4 w-4" />
                View workflows
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
