"use client"

import { useEnsureUser } from "@/hooks/use-ensure-user"

export function UserProvider({ children }: { children: React.ReactNode }) {
  useEnsureUser()
  return <>{children}</>
}
