import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { UserButton } from "@clerk/nextjs"
import { EventsList } from "./events-list"

export default async function UserDashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/")
  }

  const convexUser = await fetchQuery(api.users.getUserByClerkId, { clerkId: user.id })

  if (convexUser?.role === "admin") {
    redirect("/admin/dashboard")
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold">Hello, {user.firstName}</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      <EventsList />
    </div>
  )
}
