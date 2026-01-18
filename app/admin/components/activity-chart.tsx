"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, XAxis } from "recharts"

const data = [
  { day: "Mon", registrations: 12, submissions: 4 },
  { day: "Tue", registrations: 18, submissions: 7 },
  { day: "Wed", registrations: 24, submissions: 12 },
  { day: "Thu", registrations: 31, submissions: 18 },
  { day: "Fri", registrations: 45, submissions: 24 },
  { day: "Sat", registrations: 52, submissions: 38 },
  { day: "Sun", registrations: 65, submissions: 47 },
]

const chartConfig = {
  registrations: {
    label: "Registrations",
    color: "var(--chart-1)",
  },
  submissions: {
    label: "Submissions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ActivityChart() {
  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="registrations"
              type="monotone"
              fill="var(--chart-1)"
              fillOpacity={0.2}
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
            <Area
              dataKey="submissions"
              type="monotone"
              fill="var(--chart-2)"
              fillOpacity={0.2}
              stroke="var(--chart-2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
