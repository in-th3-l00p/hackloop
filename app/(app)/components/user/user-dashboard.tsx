import { UserStats } from "./user-stats"
import { JoinEventCard } from "./join-event-card"
import { JoinedEvents } from "./joined-events"

export function UserDashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <UserStats />
      <JoinEventCard />
      <JoinedEvents />
    </div>
  )
}
