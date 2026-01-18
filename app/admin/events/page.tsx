import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronRight } from "lucide-react"

const events = [
  {
    id: "1",
    name: "Spring Hackathon 2025",
    slug: "spring-hackathon-2025",
    status: "active",
    statusText: "Started 2h ago",
    description: "48-hour coding challenge",
    participantCount: 84,
  },
  {
    id: "2",
    name: "AI Innovation Challenge",
    slug: "ai-innovation-challenge",
    status: "published",
    statusText: "Starts in 3 days",
    description: "Build AI-powered solutions",
    participantCount: 112,
  },
  {
    id: "3",
    name: "Web3 Builder Weekend",
    slug: "web3-builder-weekend",
    status: "draft",
    statusText: "Created 1 week ago",
    description: "Decentralized app hackathon",
    participantCount: 0,
  },
  {
    id: "4",
    name: "Mobile App Sprint",
    slug: "mobile-app-sprint",
    status: "completed",
    statusText: "Ended 2 days ago",
    description: "24-hour mobile development",
    participantCount: 67,
  },
]

function StatusIndicator({ status }: { status: string }) {
  const styles = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    judging: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    completed: "bg-muted text-muted-foreground",
  }

  const dotStyles = {
    draft: "bg-muted-foreground",
    published: "bg-blue-500",
    active: "bg-green-500",
    judging: "bg-yellow-500",
    completed: "bg-muted-foreground",
  }

  return (
    <div className={`flex-none rounded-full p-1 ${styles[status as keyof typeof styles]}`}>
      <div className={`size-2 rounded-full ${dotStyles[status as keyof typeof dotStyles]}`} />
    </div>
  )
}

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">Manage your hackathon events</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 size-4" />
            Create Event
          </Link>
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-lg border">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/admin/events/${event.slug}`}
              className="relative flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-auto">
                <div className="flex items-center gap-3">
                  <StatusIndicator status={event.status} />
                  <h2 className="text-sm font-semibold">{event.name}</h2>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <p className="truncate">{event.description}</p>
                  <span className="size-1 rounded-full bg-muted-foreground" />
                  <p className="whitespace-nowrap">{event.statusText}</p>
                </div>
              </div>
              <Badge variant="secondary">{event.participantCount} participants</Badge>
              <Badge variant="outline">{event.status}</Badge>
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
