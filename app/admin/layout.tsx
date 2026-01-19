import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { AppSidebar } from "./components/app-sidebar"
import { SiteHeader } from "./components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  const user = await fetchQuery(api.users.getUserByClerkId, { clerkId: userId })

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
