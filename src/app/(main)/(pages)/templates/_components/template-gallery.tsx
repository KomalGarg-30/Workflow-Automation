'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { workflowTemplates } from '@/lib/workflow-templates'
import { onCreateWorkflowFromTemplate } from '../../workflows/_actions/workflow-connections'

export default function TemplateGallery() {
  const router = useRouter()
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null)

  async function handleUseTemplate(templateId: string) {
    setCreatingTemplate(templateId)
    try {
      const result = await onCreateWorkflowFromTemplate(templateId)
      if (!result.id) {
        toast.error(result.error)
        return
      }

      router.push(`/workflows/editor/${result.id}`)
    } catch {
      toast.error('Unable to create the workflow. Please try again.')
    } finally {
      setCreatingTemplate(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workflowTemplates.map((template) => (
        <Card key={template.id} className="flex flex-col">
          <CardHeader className="gap-4">
            <div className="flex items-center gap-3">
              {template.integrations.map((integration) => (
                <Image
                  key={integration.name}
                  src={integration.image}
                  alt={integration.name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              ))}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button
              className="w-full"
              onClick={() => handleUseTemplate(template.id)}
              disabled={creatingTemplate !== null}
            >
              {creatingTemplate === template.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating workflow
                </>
              ) : (
                <>
                  Use template
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
