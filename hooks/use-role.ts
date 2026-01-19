"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useIsAdmin(): boolean {
  const user = useQuery(api.users.getCurrentUser)
  return user?.role === "admin"
}

export function useRole(): "admin" | "user" | undefined {
  const user = useQuery(api.users.getCurrentUser)
  return user?.role
}

export function useCurrentUser() {
  return useQuery(api.users.getCurrentUser)
}
