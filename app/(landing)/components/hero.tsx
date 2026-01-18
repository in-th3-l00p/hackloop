import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-8 py-24 text-center">
      <div className="flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
        <Zap className="size-4" />
        Launch your hackathon in 5 minutes
      </div>
      <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
        Stop managing hackathons.
        <br />
        <span className="text-muted-foreground">Start experiencing them.</span>
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        A real-time collaborative platform where organizers, participants, judges, and mentors all work together seamlessly.
      </p>
      <div className="flex gap-4">
        <Button size="lg">Create Event</Button>
        <Button size="lg" variant="outline">Learn More</Button>
      </div>
    </section>
  )
}
