"use client"

import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Play, Square, Settings, Loader2, AlertTriangle } from "lucide-react"
import { useEvent } from "@/hooks/use-event"
import { TimerStat } from "./timer-stat"
import { OverviewTab } from "./overview-tab"
import { TeamsTab } from "./teams-tab"
import { SubmissionsTab } from "./submissions-tab"
import { JudgingTab } from "./judging-tab"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

const statusConfig: Record<EventStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "outline" },
  active: { label: "Live", variant: "default" },
  judging: { label: "Judging", variant: "outline" },
  completed: { label: "Stopped", variant: "secondary" },
}

export default function EventDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const {
    event,
    isLoading,
    isPending,
    isPreStart,
    isActive,
    isStopped,
    isPublished,
    dialogs,
    actions,
  } = useEvent(slug)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button asChild>
          <Link href="/admin/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[event.status]

  const stats = [
    { name: "Participants", value: event.participantCount.toString(), unit: "registered" },
    { name: "Teams", value: event.teamCount.toString(), unit: `${event.minTeamSize}-${event.maxTeamSize} members` },
    { name: "Submissions", value: event.submissionCount.toString(), unit: "projects" },
  ]

  return (
    <>
      <Tabs defaultValue="overview" className="flex flex-col">
        <div className="border-b px-4 sm:px-6 lg:px-8">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Submissions
            </TabsTrigger>
            <TabsTrigger
              value="judging"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Judging
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{event.name}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            {event.description && (
              <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isPreStart && (
              <div className="flex items-center gap-2">
                <Switch
                  id="publish-toggle"
                  checked={isPublished}
                  onCheckedChange={actions.togglePublish}
                  disabled={isPending}
                />
                <Label htmlFor="publish-toggle" className="text-sm">
                  {isPublished ? "Published" : "Draft"}
                </Label>
              </div>
            )}

            {isPreStart && (
              <Button onClick={actions.start} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Start Event
              </Button>
            )}

            {isActive && (
              <Button onClick={actions.stop} disabled={isPending} variant="destructive">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" />}
                Stop Event
              </Button>
            )}

            {isStopped && (
              <Button onClick={actions.restart} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Restart Event
              </Button>
            )}

            <Link href={`/admin/events/${slug}/settings`}>
              <Button variant="outline">
                <Settings className="size-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="rounded-none border-0 shadow-none">
              <CardContent className="px-8">
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="mt-2 flex items-baseline gap-x-2">
                  <span className="text-4xl font-semibold tracking-tight">{stat.value}</span>
                  {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                </p>
              </CardContent>
            </Card>
          ))}
          <TimerStat event={event} />
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="teams" className="mt-0">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="submissions" className="mt-0">
          <SubmissionsTab />
        </TabsContent>

        <TabsContent value="judging" className="mt-0">
          <JudgingTab />
        </TabsContent>
      </Tabs>

      <AlertDialog open={dialogs.earlyStart} onOpenChange={actions.cancelEarlyStart}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Start event early?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The scheduled start time hasn&apos;t been reached yet. Starting the event now will begin the countdown
              immediately. Participants will be able to submit their projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={actions.confirmEarlyStart}>
              Start Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogs.stop} onOpenChange={actions.cancelStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Stop event early?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The countdown hasn&apos;t finished yet. Stopping the event will prevent new submissions and end the
              hackathon for all participants. You can restart the event later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={actions.confirmStop} className="bg-destructive hover:bg-destructive/90">
              Stop Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogs.delete} onOpenChange={actions.cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{event.name}&quot; and all associated data including teams,
              submissions, and scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={actions.confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
