"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useUser, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Loader2, CheckCircle2 } from "lucide-react"

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Live Now"
    case "published":
      return "Upcoming"
    case "judging":
      return "Judging Phase"
    case "completed":
      return "Ended"
    case "draft":
      return "Not Started"
    default:
      return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "published":
      return "bg-blue-100 text-blue-800"
    case "judging":
      return "bg-amber-100 text-amber-800"
    case "completed":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function JoinEventPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { isSignedIn, isLoaded } = useUser()

  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const event = useQuery(api.participants.getEventByInviteCode, { code })
  const joinViaInviteCode = useMutation(api.participants.joinViaInviteCode)

  const handleJoin = async () => {
    setError(null)
    setIsJoining(true)

    try {
      const result = await joinViaInviteCode({ code })
      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/event/${result.slug}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join event")
    } finally {
      setIsJoining(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (event === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (event === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invite Link</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired. Please check with the event organizer for
              a valid link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">You're in!</h2>
            <p className="text-center text-muted-foreground">
              Welcome to {event.name}. Redirecting you to the event...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2">
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(event.status)}`}>
              {getStatusLabel(event.status)}
            </span>
          </div>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4" />
              <span>{event.participantCount} participants</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {isSignedIn ? (
            <Button onClick={handleJoin} disabled={isJoining} className="w-full">
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Event"
              )}
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-center text-sm text-muted-foreground">
                Sign in to join this event
              </p>
              <SignInButton mode="modal">
                <Button className="w-full">Sign In to Join</Button>
              </SignInButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
