import Link from "next/link"
import { LoginButton } from "./login-button"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex w-full max-w-5xl items-center justify-between py-6">
      <span className="text-xl font-bold">LoopHack</span>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
        <LoginButton />
      </div>
    </header>
  )
}
