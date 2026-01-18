import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { JoinEventModal } from "./join-event-modal"
import { Calendar, Clock, Users } from "lucide-react"

const joinedEvents = [
  {
    id: "1",
    name: "Spring Hackathon 2025",
    teamName: "Code Wizards",
    deadline: "2h left",
    participants: 84,
  },
  {
    id: "2",
    name: "AI Innovation Challenge",
    teamName: "Neural Network",
    deadline: "18h left",
    participants: 112,
  },
  {
    id: "3",
    name: "Mobile App Sprint",
    teamName: "App Masters",
    deadline: "Ended",
    participants: 67,
  },
]

export default async function UserDashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/")
  }

  if (user.publicMetadata?.role === "admin") {
    redirect("/admin/dashboard")
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold">Hello, {user.firstName}</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {joinedEvents.map((event) => (
          <Card key={event.id} className="flex aspect-square flex-col">
            <CardContent className="flex flex-1 flex-col justify-between p-6">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">{event.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-3" />
                  {event.teamName}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {event.participants} participants
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {event.deadline}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <JoinEventModal />
      </div>
    </div>
  )
}
