"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Users } from "lucide-react"
import { JoinEventModal } from "./join-event-modal"
import Link from "next/link"
import { useEffect, useState } from "react"

function formatTimeRemaining(ms: number | null): string {
  if (ms === null || ms <= 0) return "Ended"

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d left`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`
  }
  return `${minutes}m left`
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Live"
    case "published":
      return "Upcoming"
    case "judging":
      return "Judging"
    case "completed":
      return "Ended"
    case "draft":
      return "Draft"
    default:
      return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600"
    case "published":
      return "text-blue-600"
    case "judging":
      return "text-amber-600"
    case "completed":
      return "text-muted-foreground"
    default:
      return "text-muted-foreground"
  }
}

function EventCard({
  event,
}: {
  event: {
    _id: string
    name: string
    slug: string
    status: string
    teamName: string | null
    participantCount: number
    timeRemaining: number | null
    startDate: number
  }
}) {
  const [timeRemaining, setTimeRemaining] = useState(event.timeRemaining)

  // Update time remaining every second for active events
  useEffect(() => {
    if (event.status !== "active" || event.timeRemaining === null) return

    setTimeRemaining(event.timeRemaining)

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return 0
        return Math.max(0, prev - 1000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [event.status, event.timeRemaining])

  const displayTime =
    event.status === "active"
      ? formatTimeRemaining(timeRemaining)
      : event.status === "completed" || event.status === "judging"
        ? "Ended"
        : new Date(event.startDate).toLocaleDateString()

  return (
    <Link href={`/event/${event.slug}`}>
      <Card className="flex aspect-square cursor-pointer flex-col transition-colors hover:border-primary hover:bg-muted/50">
        <CardContent className="flex flex-1 flex-col justify-between p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${getStatusColor(event.status)}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>
            <h3 className="font-semibold">{event.name}</h3>
            {event.teamName && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="size-3" />
                {event.teamName}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              {event.participantCount} participants
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              {displayTime}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function EventsList() {
  const events = useQuery(api.events.getMyEvents)

  if (events === undefined) {
    return (
      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex aspect-square animate-pulse flex-col">
            <CardContent className="flex flex-1 flex-col justify-between p-6">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-5 w-32 rounded bg-muted" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
        <JoinEventModal />
      </div>
    )
  }

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
      <JoinEventModal />
    </div>
  )
}
