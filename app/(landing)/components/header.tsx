import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex w-full max-w-5xl items-center justify-between py-6">
      <span className="text-xl font-bold">LoopHack</span>
      <Button variant="outline" size="sm">Sign In</Button>
    </header>
  )
}
