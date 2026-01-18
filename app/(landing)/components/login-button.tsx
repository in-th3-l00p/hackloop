"use client"

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="outline" size="sm">Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  )
}
