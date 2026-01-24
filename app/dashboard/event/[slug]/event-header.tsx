"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { useEventData, statusConfig } from "./event-context"

export function EventHeader() {
  const event = useEventData()
  const statusInfo = statusConfig[event.status]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to events
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>
          {event.description && (
            <p className="mt-3 text-muted-foreground">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
