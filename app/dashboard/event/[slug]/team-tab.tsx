"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Copy, Check, Crown, Loader2, LogOut, RefreshCw, UserPlus, Eye } from "lucide-react"
import { toast } from "sonner"
import { useEventData, useParticipation } from "./event-context"
import { UserAvatar } from "@/components/user-avatar"
import { UserDetailsDialog } from "@/components/user-details-dialog"

interface UserInfo {
  _id: string
  clerkId?: string
  name?: string | null
  email?: string | null
  imageUrl?: string | null
}

export function TeamTab() {
  const event = useEventData()
  const participation = useParticipation()

  const team = useQuery(api.teams.getMyTeam, { eventId: event._id })

  const createTeam = useMutation(api.teams.createTeam)
  const joinTeamViaCode = useMutation(api.teams.joinTeamViaCode)
  const leaveTeam = useMutation(api.teams.leaveTeam)
  const regenerateCode = useMutation(api.teams.regenerateTeamInviteCode)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{
    user: UserInfo
    isLeader?: boolean
    joinedAt?: number
  } | null>(null)

  const canModifyTeam = event.status !== "completed" && event.status !== "judging"

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return

    setIsCreating(true)
    try {
      await createTeam({ eventId: event._id, name: teamName.trim() })
      setCreateDialogOpen(false)
      setTeamName("")
      toast.success("Team created!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team")
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return

    setIsJoining(true)
    try {
      await joinTeamViaCode({ eventId: event._id, inviteCode: joinCode.trim().toUpperCase() })
      setJoinDialogOpen(false)
      setJoinCode("")
      toast.success("Joined team!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join team")
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveTeam = async () => {
    setIsLeaving(true)
    try {
      await leaveTeam({ eventId: event._id })
      toast.success("Left team")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave team")
    } finally {
      setIsLeaving(false)
    }
  }

  const handleCopyCode = async () => {
    if (!team?.inviteCode) return

    await navigator.clipboard.writeText(team.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Invite code copied!")
  }

  const handleRegenerateCode = async () => {
    if (!team?._id) return

    setIsRegenerating(true)
    try {
      await regenerateCode({ teamId: team._id })
      toast.success("Invite code regenerated!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate code")
    } finally {
      setIsRegenerating(false)
    }
  }

  // Loading state
  if (team === undefined && participation.teamId) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No team - show create/join options
  if (!team) {
    return (
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Join or Create a Team</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Team size: {event.minTeamSize}-{event.maxTeamSize} members
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col gap-4 sm:flex-row">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 gap-2" disabled={!canModifyTeam}>
                <Plus className="size-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Team</DialogTitle>
                <DialogDescription>
                  Choose a name for your team. You&apos;ll be the team leader.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="e.g. Code Warriors"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && teamName.trim() && !isCreating) {
                        handleCreateTeam()
                      }
                    }}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} disabled={!teamName.trim() || isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2" disabled={!canModifyTeam}>
                <UserPlus className="size-4" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
                <DialogDescription>
                  Enter the invite code shared by your team leader.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="join-code">Team Invite Code</Label>
                  <Input
                    id="join-code"
                    placeholder="e.g. ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && joinCode.trim() && !isJoining) {
                        handleJoinTeam()
                      }
                    }}
                    disabled={isJoining}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setJoinDialogOpen(false)}
                  disabled={isJoining}
                >
                  Cancel
                </Button>
                <Button onClick={handleJoinTeam} disabled={!joinCode.trim() || isJoining}>
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Team"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!canModifyTeam && (
          <p className="text-center text-sm text-muted-foreground">
            Team modifications are disabled after the event has ended.
          </p>
        )}
      </div>
    )
  }

  // Has team - show team details
  return (
    <div className="flex flex-col gap-8">
      {/* Team Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{team.name}</h2>
            {team.isLeader && (
              <Badge variant="outline" className="gap-1">
                <Crown className="size-3" />
                Leader
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {team.members.length} / {event.maxTeamSize} members
          </p>
        </div>
        {canModifyTeam && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isLeaving}>
                {isLeaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 size-4" />
                )}
                Leave
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave team?</AlertDialogTitle>
                <AlertDialogDescription>
                  {team.isLeader && team.members.length > 1
                    ? "As the team leader, leaving will transfer leadership to another member."
                    : team.isLeader
                      ? "As the only team member, leaving will delete the team and any submissions."
                      : "You can rejoin the team later if you have the invite code."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveTeam}>Leave Team</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Invite Code */}
      {team.isLeader && canModifyTeam && (
        <div className="rounded-lg border bg-muted/30 p-5">
          <Label className="text-sm font-medium">Invite Code</Label>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-md bg-background px-4 py-2.5 font-mono text-lg tracking-wider">
              {team.inviteCode}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyCode}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
            >
              <RefreshCw className={`size-4 ${isRegenerating ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this code with others to invite them to your team
          </p>
        </div>
      )}

      {/* Team Members */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Team Members</h3>
        <div className="divide-y rounded-lg border">
          {team.members.map((member) => (
            <div key={member._id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={member.user?.name}
                  imageUrl={member.user?.imageUrl}
                  size="sm"
                />
                <div>
                  <p className="font-medium">
                    {member.user?.name ?? member.user?.clerkId ?? "Unknown"}
                  </p>
                  {member.user?.email && (
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {member.isLeader && (
                  <Badge variant="outline" className="gap-1">
                    <Crown className="size-3" />
                    Leader
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    member.user &&
                    setSelectedUser({
                      user: member.user as UserInfo,
                      isLeader: member.isLeader,
                      joinedAt: member.joinedAt,
                    })
                  }
                >
                  <Eye className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser?.user ?? null}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        isLeader={selectedUser?.isLeader}
        joinedAt={selectedUser?.joinedAt}
      />
    </div>
  )
}
