"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, FileText, UserPlus } from "lucide-react"

type ActivityType = "team_created" | "submission" | "registration"

interface ActivityItem {
  id: string
  type: ActivityType
  team: string | null
  user: string
  date: string
  dateTime: string
}

const activityItems: ActivityItem[] = [
  {
    id: "1",
    type: "team_created",
    team: "Code Wizards",
    user: "John Doe",
    date: "2 hours ago",
    dateTime: new Date().toISOString(),
  },
  {
    id: "2",
    type: "submission",
    team: "Byte Brigade",
    user: "Jane Smith",
    date: "5 hours ago",
    dateTime: new Date().toISOString(),
  },
  {
    id: "3",
    type: "registration",
    team: null,
    user: "Alice Johnson",
    date: "1 day ago",
    dateTime: new Date().toISOString(),
  },
]

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "team_created":
      return <UserPlus className="size-4" />
    case "submission":
      return <FileText className="size-4" />
    case "registration":
      return <Users className="size-4" />
  }
}

function getActivityDescription(item: ActivityItem) {
  switch (item.type) {
    case "team_created":
      return `Created team "${item.team}"`
    case "submission":
      return `Submitted project for "${item.team}"`
    case "registration":
      return "Registered for event"
  }
}

export function OverviewTab() {
  return (
    <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-base font-semibold">Latest activity</h2>
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Activity</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  No activity yet
                </TableCell>
              </TableRow>
            ) : (
              activityItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {getActivityIcon(item.type)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{item.user}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {getActivityDescription(item)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <time dateTime={item.dateTime}>{item.date}</time>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
