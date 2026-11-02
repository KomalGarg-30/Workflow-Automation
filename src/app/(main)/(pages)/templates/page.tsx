import TemplateGallery from './_components/template-gallery'

export default function TemplatesPage() {
  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Templates
      </h1>
      <section className="flex flex-col gap-4 p-6">
        <p className="text-muted-foreground">
          Start with a workflow template, then connect your apps and configure
          each step in the editor.
        </p>
        <TemplateGallery />
      </section>
    </div>
  )
}
