"use client"

import { useState } from "react"
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
import { Plus } from "lucide-react"

export function JoinEventModal() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")

  const handleJoin = () => {
    setOpen(false)
    setCode("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              placeholder="e.g. HACK-2025-SPRING"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!code.trim()}>
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
