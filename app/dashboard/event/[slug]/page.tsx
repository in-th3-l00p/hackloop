"use client"

import { use } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import { EventProvider } from "./event-context"
import { EventHeader } from "./event-header"
import { EventStats } from "./event-stats"
import { OverviewTab } from "./overview-tab"
import { TeamTab } from "./team-tab"
import { SubmissionTab } from "./submission-tab"

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

  return (
    <EventProvider event={event} participation={participation}>
      <Tabs defaultValue="overview" className="flex w-full max-w-4xl flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <EventHeader />
          <EventStats />

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
          <OverviewTab />
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <TeamTab />
        </TabsContent>

        <TabsContent value="submission" className="mt-0">
          <SubmissionTab />
        </TabsContent>
      </Tabs>
    </EventProvider>
  )
}
