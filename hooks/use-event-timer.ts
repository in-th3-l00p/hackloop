"use client"

import { useState, useEffect, useMemo } from "react"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

export interface TimeBreakdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isOver: boolean
}

export function formatMilliseconds(ms: number): TimeBreakdown {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isOver: true }
  }

  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, totalMs: ms, isOver: false }
}

export function formatTimeString(time: TimeBreakdown): string {
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

export interface EventTimerData {
  status: EventStatus
  startDate: number
  duration: number
  startedAt?: number
  pausedAt?: number
  elapsedBeforePause?: number
}

export type TimerPhase = "before_start" | "should_have_started" | "active" | "times_up" | "paused"

export interface UseEventTimerReturn {
  phase: TimerPhase
  countdown: TimeBreakdown
  remaining: TimeBreakdown
  durationBreakdown: TimeBreakdown
  canResume: boolean
  formatted: {
    countdown: string
    remaining: string
    duration: string
  }
}

export function useEventTimer(event: EventTimerData): UseEventTimerReturn {
  const { status, startDate, duration, startedAt, elapsedBeforePause } = event

  const isBeforeStart = status === "draft" || status === "published"
  const isActive = status === "active" || status === "judging"
  const isPaused = status === "completed"

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused])

  const countdown = useMemo(() => {
    return formatMilliseconds(startDate - now)
  }, [startDate, now])

  const remaining = useMemo(() => {
    if (isPaused) {
      const elapsed = elapsedBeforePause ?? 0
      return formatMilliseconds(duration - elapsed)
    }
    if (!startedAt) return formatMilliseconds(duration)
    const currentElapsed = now - startedAt
    const totalElapsed = (elapsedBeforePause ?? 0) + currentElapsed
    return formatMilliseconds(duration - totalElapsed)
  }, [isPaused, startedAt, duration, now, elapsedBeforePause])

  const canResume = isPaused && !remaining.isOver

  const durationBreakdown = useMemo(() => {
    return formatMilliseconds(duration)
  }, [duration])

  const phase = useMemo((): TimerPhase => {
    if (isPaused && remaining.isOver) return "times_up"
    if (isPaused) return "paused"
    if (isActive && remaining.isOver) return "times_up"
    if (isActive) return "active"
    if (isBeforeStart && countdown.isOver) return "should_have_started"
    return "before_start"
  }, [isPaused, isActive, isBeforeStart, remaining.isOver, countdown.isOver])

  const formatted = useMemo(
    () => ({
      countdown: formatTimeString(countdown),
      remaining: formatTimeString(remaining),
      duration: formatTimeString(durationBreakdown),
    }),
    [countdown, remaining, durationBreakdown]
  )

  return {
    phase,
    countdown,
    remaining,
    durationBreakdown,
    canResume,
    formatted,
  }
}
