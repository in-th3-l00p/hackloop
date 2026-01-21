"use client"

import { use, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Users,
  FileText,
  Play,
  Pause,
  CheckCircle,
  Eye,
  Settings,
  Trash2,
  Loader2,
  UserPlus,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

const statusConfig: Record<EventStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "outline" },
  active: { label: "Live", variant: "default" },
  judging: { label: "Judging", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
}

function getNextStatuses(current: EventStatus): { status: EventStatus; label: string; icon: React.ReactNode }[] {
  switch (current) {
    case "draft":
      return [{ status: "published", label: "Publish Event", icon: <Eye className="size-4" /> }]
    case "published":
      return [{ status: "active", label: "Start Event", icon: <Play className="size-4" /> }]
    case "active":
      return [
        { status: "judging", label: "Start Judging", icon: <Pause className="size-4" /> },
        { status: "completed", label: "End Event", icon: <CheckCircle className="size-4" /> },
      ]
    case "judging":
      return [{ status: "completed", label: "Complete Event", icon: <CheckCircle className="size-4" /> }]
    default:
      return []
  }
}

function useCountdown(targetDate: number, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate))

  function calculateTimeLeft(target: number) {
    const now = Date.now()
    const diff = target - now

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, isOver: false }
  }

  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, isActive])

  return timeLeft
}

function formatCountdown(time: { days: number; hours: number; minutes: number; seconds: number }) {
  const parts: string[] = []

  if (time.days > 0) {
    parts.push(`${time.days}d`)
  }
  if (time.hours > 0 || time.days > 0) {
    parts.push(`${time.hours}h`)
  }
  if (time.minutes > 0 || time.hours > 0 || time.days > 0) {
    parts.push(`${time.minutes}m`)
  }
  parts.push(`${time.seconds}s`)

  return parts.join(" ")
}

function TimelineStat({ status, startDate, endDate }: { status: EventStatus; startDate: number; endDate: number }) {
  const isBeforeStart = status === "draft" || status === "published"
  const isActive = status === "active" || status === "judging"
  const isCompleted = status === "completed"

  const countdown = useCountdown(
    isBeforeStart ? startDate : endDate,
    isBeforeStart || isActive
  )

  if (isCompleted) {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Timeline</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight">Ended</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(endDate, { addSuffix: true })}
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isBeforeStart) {
    if (countdown.isOver) {
      return (
        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="px-8">
            <p className="text-sm font-medium text-muted-foreground">Timeline</p>
            <p className="mt-2 flex flex-col">
              <span className="text-2xl font-semibold tracking-tight text-amber-600">Should have started</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(startDate, { addSuffix: true })}
              </span>
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Starts in</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatCountdown(countdown)}
            </span>
            <span className="text-sm text-muted-foreground">until start</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isActive) {
    if (countdown.isOver) {
      return (
        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="px-8">
            <p className="text-sm font-medium text-muted-foreground">Timeline</p>
            <p className="mt-2 flex flex-col">
              <span className="text-2xl font-semibold tracking-tight text-amber-600">Time&apos;s up!</span>
              <span className="text-sm text-muted-foreground">
                Ended {formatDistanceToNow(endDate, { addSuffix: true })}
              </span>
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Time remaining</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatCountdown(countdown)}
            </span>
            <span className="text-sm text-muted-foreground">until deadline</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return null
}

export default function EventDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const event = useQuery(api.events.getBySlug, { slug })
  const updateStatus = useMutation(api.events.updateStatus)
  const deleteEvent = useMutation(api.events.remove)
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (event === undefined) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (event === null) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button asChild>
          <Link href="/admin/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  const handleStatusChange = (newStatus: EventStatus) => {
    startTransition(async () => {
      await updateStatus({ id: event._id, status: newStatus })
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteEvent({ id: event._id })
      router.push("/admin/events")
    })
  }

  const nextStatuses = getNextStatuses(event.status)
  const statusInfo = statusConfig[event.status]

  const stats = [
    { name: "Participants", value: event.participantCount.toString(), unit: "registered" },
    { name: "Teams", value: event.teamCount.toString(), unit: `${event.minTeamSize}-${event.maxTeamSize} members` },
    { name: "Submissions", value: event.submissionCount.toString(), unit: "projects" },
  ]

  const activityItems = [
    {
      id: "1",
      type: "team_created" as const,
      team: "Code Wizards",
      user: "John Doe",
      date: "2 hours ago",
      dateTime: new Date().toISOString(),
    },
    {
      id: "2",
      type: "submission" as const,
      team: "Byte Brigade",
      user: "Jane Smith",
      date: "5 hours ago",
      dateTime: new Date().toISOString(),
    },
    {
      id: "3",
      type: "registration" as const,
      team: null,
      user: "Alice Johnson",
      date: "1 day ago",
      dateTime: new Date().toISOString(),
    },
  ]

  const getActivityIcon = (type: "team_created" | "submission" | "registration") => {
    switch (type) {
      case "team_created":
        return <UserPlus className="size-4" />
      case "submission":
        return <FileText className="size-4" />
      case "registration":
        return <Users className="size-4" />
    }
  }

  const getActivityDescription = (item: (typeof activityItems)[0]) => {
    switch (item.type) {
      case "team_created":
        return `Created team "${item.team}"`
      case "submission":
        return `Submitted project for "${item.team}"`
      case "registration":
        return "Registered for event"
    }
  }

  return (
    <>
      <Tabs defaultValue="overview" className="flex flex-col">
        {/* Tabs Navigation */}
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
          <div className="flex items-center gap-2">
            {nextStatuses.length > 0 && (
              <Button
                onClick={() => handleStatusChange(nextStatuses[0].status)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : nextStatuses[0].icon}
                {nextStatuses[0].label}
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

        {/* Stats */}
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
          <TimelineStat status={event.status} startDate={event.startDate} endDate={event.endDate} />
        </div>

        {/* Tab Content */}
        <TabsContent value="overview" className="mt-0">
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-base font-semibold">Latest activity</h2>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Activity</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                        No activity yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    activityItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="text-xs">
                                {getActivityIcon(item.type)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{item.user}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {getActivityDescription(item)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <time dateTime={item.dateTime}>{item.date}</time>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-0">
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">Teams management coming soon</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-0">
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">Submissions management coming soon</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="judging" className="mt-0">
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">Judging management coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
