"use client"

import { createContext, useContext, ReactNode } from "react"
import { Id } from "@/convex/_generated/dataModel"

export type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

export interface Announcement {
  _id: string
  title: string
  content: string
  priority: "normal" | "important" | "urgent"
  createdAt: number
  authorName: string
}

export interface EventTheme {
  title: string
  description?: string
}

export interface EventData {
  _id: Id<"events">
  name: string
  slug: string
  description?: string
  status: EventStatus
  startDate: number
  duration: number
  startedAt?: number
  pausedAt?: number
  elapsedBeforePause?: number
  participantCount: number
  teamCount: number
  minTeamSize: number
  maxTeamSize: number
  announcements: Announcement[]
  theme?: EventTheme
}

export interface Participation {
  _id: Id<"eventParticipants">
  teamId?: Id<"teams">
  team?: { name: string } | null
}

interface EventContextValue {
  event: EventData
  participation: Participation
}

const EventContext = createContext<EventContextValue | null>(null)

export function EventProvider({
  children,
  event,
  participation,
}: {
  children: ReactNode
  event: EventData
  participation: Participation
}) {
  return (
    <EventContext.Provider value={{ event, participation }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider")
  }
  return context
}

export function useEventData() {
  return useEvent().event
}

export function useParticipation() {
  return useEvent().participation
}

export const statusConfig: Record<
  EventStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  draft: { label: "Not Started", variant: "secondary", color: "bg-gray-100 text-gray-700" },
  published: { label: "Upcoming", variant: "outline", color: "bg-blue-50 text-blue-700" },
  active: { label: "Live", variant: "default", color: "bg-green-50 text-green-700" },
  judging: { label: "Judging", variant: "outline", color: "bg-amber-50 text-amber-700" },
  completed: { label: "Ended", variant: "secondary", color: "bg-gray-100 text-gray-600" },
}
