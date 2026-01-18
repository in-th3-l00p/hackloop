"use client"

import { useUser } from "@clerk/nextjs"

export function useIsAdmin(): boolean {
  const { user } = useUser()
  return user?.publicMetadata?.role === "admin"
}

export function useRole(): "admin" | "user" {
  const { user } = useUser()
  return user?.publicMetadata?.role === "admin" ? "admin" : "user"
}
