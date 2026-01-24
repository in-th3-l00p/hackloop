"use client"

import { Users, UsersRound } from "lucide-react"
import { useEventData } from "./event-context"
import { TimerDisplay } from "./timer-display"
import { StatItem } from "./stat-item"

export function EventStats() {
  const event = useEventData()

  return (
    <div className="flex flex-wrap items-center gap-8 border-y py-4">
      <TimerDisplay />
      <div className="h-8 w-px bg-border" />
      <StatItem icon={Users} value={event.participantCount} label="Participants" />
      <StatItem icon={UsersRound} value={event.teamCount} label="Teams" />
      <StatItem icon={Users} value={`${event.minTeamSize}-${event.maxTeamSize}`} label="Team Size" />
    </div>
  )
}
