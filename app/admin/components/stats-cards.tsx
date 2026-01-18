import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Trophy, Clock } from "lucide-react"

const stats = [
  { title: "Active Events", value: "3", icon: Calendar, change: "+1 this week" },
  { title: "Total Participants", value: "247", icon: Users, change: "+23 today" },
  { title: "Submissions", value: "89", icon: Trophy, change: "12 pending" },
  { title: "Avg. Time Left", value: "18h", icon: Clock, change: "2 ending soon" },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
