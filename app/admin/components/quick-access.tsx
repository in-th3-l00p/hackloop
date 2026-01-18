import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, Plus } from "lucide-react"

const links = [
  { title: "Create Event", href: "/admin/events/new", icon: Plus },
  { title: "Events", href: "/admin/events", icon: Calendar },
  { title: "Users", href: "/admin/users", icon: Users },
]

export function QuickAccess() {
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-3 lg:px-6">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <link.icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">{link.title}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
