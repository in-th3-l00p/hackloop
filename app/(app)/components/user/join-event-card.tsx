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

export function JoinEventCard() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")

  const handleJoin = () => {
    setOpen(false)
    setCode("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="mx-4 cursor-pointer border-dashed transition-colors hover:border-primary hover:bg-muted/50 lg:mx-6">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <span className="font-medium">Join Event</span>
            <span className="text-sm text-muted-foreground">
              Enter an event code to participate
            </span>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Event</DialogTitle>
          <DialogDescription>
            Enter the event code provided by the organizer to join a hackathon.
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
            Join Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
