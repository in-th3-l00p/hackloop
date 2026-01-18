import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users } from "lucide-react"

const joinedEvents = [
  {
    id: "1",
    name: "Spring Hackathon 2025",
    status: "active",
    teamName: "Code Wizards",
    deadline: "2h left",
    submissionStatus: "draft",
  },
  {
    id: "2",
    name: "AI Innovation Challenge",
    status: "active",
    teamName: "Neural Network",
    deadline: "18h left",
    submissionStatus: "submitted",
  },
  {
    id: "3",
    name: "Mobile App Sprint",
    status: "completed",
    teamName: "App Masters",
    deadline: "Ended",
    submissionStatus: "submitted",
  },
]

export function JoinedEvents() {
  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>My Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {joinedEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{event.name}</span>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {event.teamName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {event.deadline}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={event.submissionStatus === "submitted" ? "default" : "secondary"}
                >
                  {event.submissionStatus}
                </Badge>
                {event.status === "active" && (
                  <Button size="sm" variant="outline">
                    Open Workspace
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
