"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useEnsureUser() {
  const { isSignedIn, isLoaded } = useUser()
  const ensureUser = useMutation(api.users.ensureUser)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      ensureUser()
    }
  }, [isLoaded, isSignedIn, ensureUser])
}
