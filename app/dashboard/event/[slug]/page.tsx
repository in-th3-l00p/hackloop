"use client"

import { use } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Loader2,
  Users,
  Clock,
  Megaphone,
  FileText,
  ArrowLeft,
  AlertCircle,
  UsersRound,
} from "lucide-react"
import { useEventTimer } from "@/hooks/use-event-timer"
import { TeamTab } from "./team-tab"
import { SubmissionTab } from "./submission-tab"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

const statusConfig: Record<
  EventStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  draft: { label: "Not Started", variant: "secondary", color: "bg-gray-100 text-gray-700" },
  published: { label: "Upcoming", variant: "outline", color: "bg-blue-50 text-blue-700" },
  active: { label: "Live", variant: "default", color: "bg-green-50 text-green-700" },
  judging: { label: "Judging", variant: "outline", color: "bg-amber-50 text-amber-700" },
  completed: { label: "Ended", variant: "secondary", color: "bg-gray-100 text-gray-600" },
}

function TimerDisplay({
  event,
}: {
  event: {
    status: EventStatus
    startDate: number
    duration: number
    startedAt?: number
    pausedAt?: number
    elapsedBeforePause?: number
  }
}) {
  const timer = useEventTimer(event)

  if (timer.phase === "before_start") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
          <Clock className="size-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Starts in</p>
          <p className="text-xl font-bold tabular-nums">{timer.formatted.countdown}</p>
        </div>
      </div>
    )
  }

  if (timer.phase === "should_have_started") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-100">
          <Clock className="size-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-amber-600">Should have started</p>
          <p className="text-xl font-bold tabular-nums text-amber-600">Waiting...</p>
        </div>
      </div>
    )
  }

  if (timer.phase === "active") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
          <Clock className="size-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Time remaining</p>
          <p className="text-xl font-bold tabular-nums text-green-600">{timer.formatted.remaining}</p>
        </div>
      </div>
    )
  }

  if (timer.phase === "times_up" || timer.phase === "paused") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
          <Clock className="size-5 text-gray-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Event ended</p>
          <p className="text-xl font-bold tabular-nums text-muted-foreground">Time&apos;s up!</p>
        </div>
      </div>
    )
  }

  return null
}

function AnnouncementsList({
  announcements,
}: {
  announcements: Array<{
    _id: string
    title: string
    content: string
    priority: "normal" | "important" | "urgent"
    createdAt: number
    authorName: string
  }>
}) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Megaphone className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No announcements yet</p>
      </div>
    )
  }

  const priorityStyles = {
    normal: "border-l-gray-300",
    important: "border-l-amber-400 bg-amber-50/50",
    urgent: "border-l-red-400 bg-red-50/50",
  }

  return (
    <div className="flex flex-col gap-4">
      {announcements.map((announcement) => (
        <div
          key={announcement._id}
          className={`border-l-4 py-3 pl-4 ${priorityStyles[announcement.priority]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium">{announcement.title}</h4>
            {announcement.priority !== "normal" && (
              <Badge
                variant={announcement.priority === "urgent" ? "destructive" : "outline"}
                className="shrink-0 text-xs"
              >
                {announcement.priority}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{announcement.content}</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            {new Date(announcement.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}

function StatItem({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function ParticipantEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { isSignedIn, isLoaded: isUserLoaded } = useUser()

  const event = useQuery(api.events.getEventBySlugForParticipant, { slug })
  const participation = useQuery(
    api.participants.getMyParticipation,
    event ? { eventId: event._id } : "skip"
  )

  if (!isUserLoaded || event === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (event === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Event Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            This event doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Sign In Required</h2>
          <p className="mt-2 text-muted-foreground">Please sign in to view this event.</p>
        </div>
        <Button asChild>
          <Link href="/">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (participation === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (participation === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="size-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Not a Participant</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            You&apos;re not registered for this event. Ask the organizer for an invite link to join.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[event.status]

  return (
    <Tabs defaultValue="overview" className="flex w-full max-w-4xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to events
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{event.name}</h1>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>
            {event.description && (
              <p className="mt-3 text-muted-foreground">{event.description}</p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-8 border-y py-4">
          <TimerDisplay event={event} />
          <div className="h-8 w-px bg-border" />
          <StatItem icon={Users} value={event.participantCount} label="Participants" />
          <StatItem icon={UsersRound} value={event.teamCount} label="Teams" />
          <StatItem icon={Users} value={`${event.minTeamSize}-${event.maxTeamSize}`} label="Team Size" />
        </div>

        {/* Tab Navigation */}
        <TabsList className="h-auto w-fit bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-full border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-full border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Team
          </TabsTrigger>
          <TabsTrigger
            value="submission"
            className="rounded-full border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Submission
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab Content */}
      <TabsContent value="overview" className="mt-0">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Announcements */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Megaphone className="size-5" />
              Announcements
            </h2>
            <AnnouncementsList announcements={event.announcements} />
          </section>

          {/* Theme */}
          {event.theme && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FileText className="size-5" />
                Theme
              </h2>
              <div className="rounded-lg border bg-muted/30 p-5">
                <h3 className="text-lg font-medium">{event.theme.title}</h3>
                {event.theme.description && (
                  <p className="mt-2 text-muted-foreground">{event.theme.description}</p>
                )}
              </div>
            </section>
          )}
        </div>
      </TabsContent>

      <TabsContent value="team" className="mt-0">
        <TeamTab eventId={event._id} participation={participation} event={event} />
      </TabsContent>

      <TabsContent value="submission" className="mt-0">
        <SubmissionTab eventId={event._id} teamId={participation.teamId} eventStatus={event.status} />
      </TabsContent>
    </Tabs>
  )
}
