"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, Crown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserInfo {
  _id: string
  clerkId?: string
  name?: string | null
  email?: string | null
  imageUrl?: string | null
}

interface UserDetailsDialogProps {
  user: UserInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLeader?: boolean
  joinedAt?: number
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  isLeader,
  joinedAt,
}: UserDetailsDialogProps) {
  if (!user) return null

  const displayName = user.name ?? user.clerkId ?? "Unknown"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View participant information
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <UserAvatar
            name={user.name}
            imageUrl={user.imageUrl}
            size="lg"
            className="size-20"
          />

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold">{displayName}</h3>
              {isLeader && (
                <Badge variant="outline" className="gap-1">
                  <Crown className="size-3" />
                  Leader
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          {user.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
          )}

          {joinedAt && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span>Joined {formatDistanceToNow(joinedAt, { addSuffix: true })}</span>
            </div>
          )}

          {!user.email && !joinedAt && (
            <p className="text-sm text-muted-foreground">No additional details available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
