import Link from "next/link"
import { LoginButton } from "./login-button"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"

export async function Header() {
  const { isAuthenticated } = await auth();

  return (
    <header className="flex w-full max-w-5xl items-center justify-between py-6">
      <span className="text-xl font-bold">LoopHack</span>
      <div className="flex items-center gap-4">
        {isAuthenticated && (
          <Link href="/dashboard" className="text-sm">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        )}
        <LoginButton />
      </div>
    </header>
  )
}
