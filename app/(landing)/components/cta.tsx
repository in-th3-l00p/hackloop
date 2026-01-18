import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="flex flex-col items-center gap-6 rounded-lg border bg-muted/50 px-8 py-16 text-center">
      <h2 className="text-3xl font-bold tracking-tight">Ready to launch?</h2>
      <p className="max-w-md text-muted-foreground">
        Set up your hackathon in minutes, not days. Focus on creating amazing events.
      </p>
      <Button size="lg">Get Started Free</Button>
    </section>
  )
}
