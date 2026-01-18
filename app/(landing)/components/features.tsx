import { Users, Clock, Shield, BarChart } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Instant & Live",
    description: "Real-time updates everywhere. No refresh needed.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description: "Shared collaboration with auto-save and live editing.",
  },
  {
    icon: Shield,
    title: "Zero Anxiety",
    description: "Clear status indicators. Impossible to lose work.",
  },
  {
    icon: BarChart,
    title: "Live Judging",
    description: "Clean scoring interface with real-time leaderboards.",
  },
]

export function Features() {
  return (
    <section className="flex flex-col items-center gap-12 py-24">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Everything in one place</h2>
        <p className="mt-2 text-muted-foreground">No more juggling 5+ tools to run your hackathon.</p>
      </div>
      <div className="grid max-w-4xl gap-8 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <feature.icon className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
