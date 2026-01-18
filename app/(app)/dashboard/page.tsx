import { isAdmin } from "@/lib/auth"
import { AdminDashboard } from "../components/admin/admin-dashboard"
import { UserDashboard } from "../components/user/user-dashboard"

export default async function DashboardPage() {
  const admin = await isAdmin()

  return admin ? <AdminDashboard /> : <UserDashboard />
}
