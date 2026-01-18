"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { isAdmin } from "@/lib/auth"

export interface ClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
  role: "admin" | "user"
  createdAt: number
  banned: boolean
}

export async function getUsers(): Promise<ClerkUser[]> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error("Unauthorized")
  }

  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({
    limit: 100,
    orderBy: "-created_at",
  })

  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: user.imageUrl,
    role: (user.publicMetadata?.role as "admin" | "user") ?? "user",
    createdAt: user.createdAt,
    banned: user.banned,
  }))
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "user"
): Promise<{ success: boolean; error?: string }> {
  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to update user role:", error)
    return { success: false, error: "Failed to update user role" }
  }
}

export async function banUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const client = await clerkClient()
    await client.users.banUser(userId)
    return { success: true }
  } catch (error) {
    console.error("Failed to ban user:", error)
    return { success: false, error: "Failed to ban user" }
  }
}

export async function unbanUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const client = await clerkClient()
    await client.users.unbanUser(userId)
    return { success: true }
  } catch (error) {
    console.error("Failed to unban user:", error)
    return { success: false, error: "Failed to unban user" }
  }
}
