import { StatsCards } from "./stats-cards"
import { RecentEvents } from "./recent-events"
import { ActivityChart } from "./activity-chart"

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <StatsCards />
      <ActivityChart />
      <RecentEvents />
    </div>
  )
}
