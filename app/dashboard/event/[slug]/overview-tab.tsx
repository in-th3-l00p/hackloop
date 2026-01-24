"use client"

import { Megaphone, FileText } from "lucide-react"
import { useEventData } from "./event-context"
import { AnnouncementsList } from "./announcements-list"

export function OverviewTab() {
  const event = useEventData()

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Announcements */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Megaphone className="size-5" />
          Announcements
        </h2>
        <AnnouncementsList />
      </section>

      {/* Theme */}
      {event.theme && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="size-5" />
            Theme
          </h2>
          <div className="rounded-lg border bg-muted/30 p-5">
            <h3 className="text-lg font-medium">{event.theme.title}</h3>
            {event.theme.description && (
              <p className="mt-2 text-muted-foreground">{event.theme.description}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
