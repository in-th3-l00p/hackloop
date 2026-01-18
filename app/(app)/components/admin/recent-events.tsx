import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const events = [
  { name: "Spring Hackathon 2025", status: "active", participants: 84, deadline: "2h left" },
  { name: "AI Innovation Challenge", status: "active", participants: 112, deadline: "18h left" },
  { name: "Web3 Builder Weekend", status: "upcoming", participants: 51, deadline: "Starts in 3d" },
  { name: "Mobile App Sprint", status: "completed", participants: 67, deadline: "Ended" },
]

export function RecentEvents() {
  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.name} className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{event.name}</span>
                <span className="text-sm text-muted-foreground">
                  {event.participants} participants
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{event.deadline}</span>
                <Badge
                  variant={
                    event.status === "active"
                      ? "default"
                      : event.status === "upcoming"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
