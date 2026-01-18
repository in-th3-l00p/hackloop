"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronRight, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

function StatusIndicator({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    judging: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    completed: "bg-muted text-muted-foreground",
  }

  const dotStyles: Record<EventStatus, string> = {
    draft: "bg-muted-foreground",
    published: "bg-blue-500",
    active: "bg-green-500",
    judging: "bg-yellow-500",
    completed: "bg-muted-foreground",
  }

  return (
    <div className={`flex-none rounded-full p-1 ${styles[status]}`}>
      <div className={`size-2 rounded-full ${dotStyles[status]}`} />
    </div>
  )
}

function getStatusText(event: { status: EventStatus; startDate: number; endDate: number }) {
  const now = Date.now()

  switch (event.status) {
    case "draft":
      return "Draft"
    case "published":
      if (event.startDate > now) {
        return `Starts ${formatDistanceToNow(event.startDate, { addSuffix: true })}`
      }
      return "Ready to start"
    case "active":
      return `Ends ${formatDistanceToNow(event.endDate, { addSuffix: true })}`
    case "judging":
      return "Judging in progress"
    case "completed":
      return `Ended ${formatDistanceToNow(event.endDate, { addSuffix: true })}`
    default:
      return event.status
  }
}

export default function EventsPage() {
  const events = useQuery(api.events.list)

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

      {events === undefined ? (
        <div className="flex h-48 items-center justify-center rounded-lg border">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-lg border text-center">
          <p className="text-muted-foreground">No events yet</p>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="mr-2 size-4" />
              Create your first event
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border">
          {events.map((event) => (
            <li key={event._id}>
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
                    <p className="whitespace-nowrap">{getStatusText(event)}</p>
                  </div>
                </div>
                <Badge variant="secondary">{event.participantCount} participants</Badge>
                <Badge variant="outline">{event.status}</Badge>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
