"use client"

import { use } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Loader2,
  Users,
  Clock,
  Megaphone,
  FileText,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import { useEventTimer, formatTimeString } from "@/hooks/use-event-timer"
import { TeamTab } from "./team-tab"
import { SubmissionTab } from "./submission-tab"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

const statusConfig: Record<
  EventStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Not Started", variant: "secondary" },
  published: { label: "Upcoming", variant: "outline" },
  active: { label: "Live", variant: "default" },
  judging: { label: "Judging", variant: "outline" },
  completed: { label: "Ended", variant: "secondary" },
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
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Starts in</p>
        <p className="text-3xl font-bold tabular-nums">{timer.formatted.countdown}</p>
      </div>
    )
  }

  if (timer.phase === "should_have_started") {
    return (
      <div className="text-center">
        <p className="text-sm text-amber-600">Should have started</p>
        <p className="text-3xl font-bold tabular-nums text-amber-600">Waiting...</p>
      </div>
    )
  }

  if (timer.phase === "active") {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Time remaining</p>
        <p className="text-3xl font-bold tabular-nums text-green-600">{timer.formatted.remaining}</p>
      </div>
    )
  }

  if (timer.phase === "times_up" || timer.phase === "paused") {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Event ended</p>
        <p className="text-3xl font-bold tabular-nums text-muted-foreground">Time&apos;s up!</p>
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
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Megaphone className="mb-2 size-8" />
        <p>No announcements yet</p>
      </div>
    )
  }

  const priorityStyles = {
    normal: "border-l-muted-foreground",
    important: "border-l-amber-500 bg-amber-50",
    urgent: "border-l-red-500 bg-red-50",
  }

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((announcement) => (
        <div
          key={announcement._id}
          className={`rounded-lg border border-l-4 p-4 ${priorityStyles[announcement.priority]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium">{announcement.title}</h4>
            {announcement.priority !== "normal" && (
              <Badge variant={announcement.priority === "urgent" ? "destructive" : "outline"}>
                {announcement.priority}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{announcement.content}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(announcement.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (event === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              This event doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 size-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view this event.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (participation === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (participation === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="size-6 text-amber-600" />
            </div>
            <CardTitle>Not a Participant</CardTitle>
            <CardDescription>
              You&apos;re not registered for this event. Ask the organizer for an invite link to
              join.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 size-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = statusConfig[event.status]

  return (
    <div className="min-h-screen">
      <Tabs defaultValue="overview" className="flex flex-col">
        <div className="border-b px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-2">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-5" />
            </Link>
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Team
              </TabsTrigger>
              <TabsTrigger
                value="submission"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Submission
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{event.name}</h1>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
                {event.description && (
                  <p className="mt-2 max-w-2xl text-muted-foreground">{event.description}</p>
                )}
              </div>
              <Card className="shrink-0">
                <CardContent className="p-4">
                  <TimerDisplay event={event} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{event.participantCount}</p>
                    <p className="text-sm text-muted-foreground">Participants</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{event.teamCount}</p>
                    <p className="text-sm text-muted-foreground">Teams</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Clock className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {event.minTeamSize}-{event.maxTeamSize}
                    </p>
                    <p className="text-sm text-muted-foreground">Team Size</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="mt-0 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="size-5" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnnouncementsList announcements={event.announcements} />
              </CardContent>
            </Card>

            {event.theme && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold">{event.theme.title}</h3>
                  {event.theme.description && (
                    <p className="mt-2 text-muted-foreground">{event.theme.description}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-0 px-4 pb-8 sm:px-6 lg:px-8">
          <TeamTab eventId={event._id} participation={participation} event={event} />
        </TabsContent>

        <TabsContent value="submission" className="mt-0 px-4 pb-8 sm:px-6 lg:px-8">
          <SubmissionTab eventId={event._id} teamId={participation.teamId} eventStatus={event.status} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
