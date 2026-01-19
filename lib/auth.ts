import { auth } from "@clerk/nextjs/server"

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

export async function getClerkId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
