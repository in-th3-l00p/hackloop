"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEventTimer, type EventTimerData } from "@/hooks/use-event-timer"
import { formatDistanceToNow } from "date-fns"

interface TimerStatProps {
  event: EventTimerData
}

export function TimerStat({ event }: TimerStatProps) {
  const timer = useEventTimer(event)

  if (timer.phase === "paused") {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Timer</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight">Paused</span>
            <span className="text-sm text-muted-foreground">
              {timer.remaining.totalMs > 0 ? `${timer.formatted.remaining} remaining` : "Time expired"}
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (timer.phase === "should_have_started") {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Timer</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-amber-600">Should have started</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(event.startDate, { addSuffix: true })}
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (timer.phase === "before_start") {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Starts in</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {timer.formatted.countdown}
            </span>
            <span className="text-sm text-muted-foreground">
              Duration: {timer.formatted.duration}
            </span>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (timer.phase === "times_up") {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Timer</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-amber-600">Time&apos;s up!</span>
            <span className="text-sm text-muted-foreground">Waiting for auto-stop</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (timer.phase === "active") {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="px-8">
          <p className="text-sm font-medium text-muted-foreground">Time remaining</p>
          <p className="mt-2 flex flex-col">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {timer.formatted.remaining}
            </span>
            <span className="text-sm text-muted-foreground">until deadline</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return null
}
