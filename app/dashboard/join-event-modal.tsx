"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"

export function JoinEventModal() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const joinViaInviteCode = useMutation(api.participants.joinViaInviteCode)

  const handleJoin = async () => {
    if (!code.trim()) return

    setError(null)
    setIsLoading(true)

    try {
      const result = await joinViaInviteCode({ code: code.trim().toUpperCase() })
      setOpen(false)
      setCode("")
      router.push(`/dashboard/event/${result.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join event")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setCode("")
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Card className="flex aspect-square cursor-pointer flex-col border-dashed transition-colors hover:border-primary hover:bg-muted/50">
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <span className="font-medium">Join Event</span>
            <span className="text-center text-sm text-muted-foreground">
              Enter a code to join
            </span>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Event</DialogTitle>
          <DialogDescription>
            Enter the event code provided by the organizer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Event Code</Label>
            <Input
              id="code"
              placeholder="e.g. ABC12345"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.trim() && !isLoading) {
                  handleJoin()
                }
              }}
              disabled={isLoading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!code.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
