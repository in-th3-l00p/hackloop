import { auth, currentUser } from "@clerk/nextjs/server"

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser()
  return user?.publicMetadata?.role === "admin"
}

export async function getRole(): Promise<"admin" | "user"> {
  const user = await currentUser()
  return user?.publicMetadata?.role === "admin" ? "admin" : "user"
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}
