"use client"

import { useEventTimer } from "@/hooks/use-event-timer"
import { useEventData } from "./event-context"

export function TimerDisplay() {
  const event = useEventData()
  const timer = useEventTimer(event)

  if (timer.phase === "before_start") {
    return (
      <div className="flex items-center gap-3">
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
        <div>
          <p className="text-sm">Should have started</p>
          <p className="text-xl font-bold tabular-nums">Waiting...</p>
        </div>
      </div>
    )
  }

  if (timer.phase === "active") {
    return (
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Time remaining</p>
          <p className="text-xl font-bold tabular-nums">{timer.formatted.remaining}</p>
        </div>
      </div>
    )
  }

  if (timer.phase === "times_up" || timer.phase === "paused") {
    return (
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Event ended</p>
          <p className="text-xl font-bold tabular-nums text-muted-foreground">Time&apos;s up!</p>
        </div>
      </div>
    )
  }

  return null
}
