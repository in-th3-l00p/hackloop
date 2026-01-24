"use client"

import { Badge } from "@/components/ui/badge"
import { Megaphone } from "lucide-react"
import { useEventData } from "./event-context"

const priorityStyles = {
  normal: "border-l-gray-300",
  important: "border-l-amber-400 bg-amber-50/50",
  urgent: "border-l-red-400 bg-red-50/50",
}

export function AnnouncementsList() {
  const { announcements } = useEventData()

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Megaphone className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No announcements yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {announcements.map((announcement) => (
        <div
          key={announcement._id}
          className={`border-l-4 py-3 pl-4 ${priorityStyles[announcement.priority]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium">{announcement.title}</h4>
            {announcement.priority !== "normal" && (
              <Badge
                variant={announcement.priority === "urgent" ? "destructive" : "outline"}
                className="shrink-0 text-xs"
              >
                {announcement.priority}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{announcement.content}</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            {new Date(announcement.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
