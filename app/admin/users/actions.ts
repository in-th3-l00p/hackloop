"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Not authenticated")
  }

  const user = await fetchQuery(api.users.getUserByClerkId, { clerkId: userId })
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  return user
}

export interface ClerkUserInfo {
  clerkId: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
  createdAt: number
  banned: boolean
}

export async function getClerkUsers(): Promise<ClerkUserInfo[]> {
  await requireAdmin()

  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({
    limit: 100,
    orderBy: "-created_at",
  })

  return users.map((user) => ({
    clerkId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    banned: user.banned,
  }))
}

export async function banUser(
  clerkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const client = await clerkClient()
    await client.users.banUser(clerkId)
    return { success: true }
  } catch (error) {
    console.error("Failed to ban user:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to ban user" }
  }
}

export async function unbanUser(
  clerkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    const client = await clerkClient()
    await client.users.unbanUser(clerkId)
    return { success: true }
  } catch (error) {
    console.error("Failed to unban user:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to unban user" }
  }
}
