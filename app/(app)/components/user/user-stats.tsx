import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Trophy, Clock } from "lucide-react"

const stats = [
  { title: "Joined Events", value: "3", icon: Calendar },
  { title: "Submissions", value: "2", icon: Trophy },
  { title: "Active", value: "2", icon: Clock },
]

export function UserStats() {
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-3 lg:px-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
