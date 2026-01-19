"use client"

import { use, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Users,
  Trophy,
  FileText,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  Eye,
  Settings,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  UserPlus,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

const statusConfig: Record<
  EventStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  active: { label: "Active", variant: "default" },
  judging: { label: "Judging", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
}

function getNextStatuses(current: EventStatus): { status: EventStatus; label: string; icon: React.ReactNode }[] {
  switch (current) {
    case "draft":
      return [{ status: "published", label: "Publish Event", icon: <Eye className="mr-2 size-4" /> }]
    case "published":
      return [{ status: "active", label: "Start Event", icon: <Play className="mr-2 size-4" /> }]
    case "active":
      return [
        { status: "judging", label: "Start Judging", icon: <Pause className="mr-2 size-4" /> },
        { status: "completed", label: "End Event", icon: <CheckCircle className="mr-2 size-4" /> },
      ]
    case "judging":
      return [{ status: "completed", label: "Complete Event", icon: <CheckCircle className="mr-2 size-4" /> }]
    default:
      return []
  }
}

export default function EventDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const event = useQuery(api.events.getBySlug, { slug })
  const updateStatus = useMutation(api.events.updateStatus)
  const deleteEvent = useMutation(api.events.remove)
  const [isPending, startTransition] = useTransition()

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/admin/events">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    nextStatuses[0].icon
                  )}
                  {nextStatuses[0].label}
                </Button>
              </DropdownMenuTrigger>
              {nextStatuses.length > 1 && (
                <DropdownMenuContent align="end">
                  {nextStatuses.map((item) => (
                    <DropdownMenuItem
                      key={item.status}
                      onClick={() => handleStatusChange(item.status)}
                    >
                      {item.icon}
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          )}
          {nextStatuses.length === 1 && (
            <Button onClick={() => handleStatusChange(nextStatuses[0].status)} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : nextStatuses[0].icon}
              {nextStatuses[0].label}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/events/${slug}/settings`}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete Event
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete event?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{event.name}&quot; and all associated data
                      including teams, submissions, and scores. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.participantCount}</div>
            <p className="text-xs text-muted-foreground">registered participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <UserPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.teamCount}</div>
            <p className="text-xs text-muted-foreground">
              {event.minTeamSize}-{event.maxTeamSize} members per team
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.submissionCount}</div>
            <p className="text-xs text-muted-foreground">submitted projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.status === "active"
                ? formatDistanceToNow(event.endDate, { addSuffix: false })
                : event.status === "completed"
                  ? "Ended"
                  : formatDistanceToNow(event.startDate, { addSuffix: false })}
            </div>
            <p className="text-xs text-muted-foreground">
              {event.status === "active"
                ? "remaining"
                : event.status === "completed"
                  ? format(event.endDate, "MMM d, yyyy")
                  : "until start"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your event</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/admin/events/${slug}/participants`}>
                <Users className="mr-2 size-4" />
                View Participants
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/admin/events/${slug}/teams`}>
                <UserPlus className="mr-2 size-4" />
                Manage Teams
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/admin/events/${slug}/submissions`}>
                <FileText className="mr-2 size-4" />
                View Submissions
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/admin/events/${slug}/judging`}>
                <Trophy className="mr-2 size-4" />
                Judging & Results
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Schedule and configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(event.startDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(event.endDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Team Size</p>
                <p className="text-sm text-muted-foreground">
                  {event.minTeamSize} - {event.maxTeamSize} members
                </p>
              </div>
            </div>
            {event.theme && (
              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Theme: {event.theme.title}</p>
                  {event.theme.description && (
                    <p className="text-sm text-muted-foreground">{event.theme.description}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Activity feed coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
