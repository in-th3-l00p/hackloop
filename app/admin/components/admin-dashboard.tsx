import { QuickAccess } from "./quick-access"
import { StatsCards } from "./stats-cards"

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <QuickAccess />
      <StatsCards />
    </div>
  )
}
