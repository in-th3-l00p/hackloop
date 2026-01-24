"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Plus, Copy, Check, Crown, Loader2, LogOut, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface TeamTabProps {
  eventId: Id<"events">
  participation: {
    _id: Id<"eventParticipants">
    teamId?: Id<"teams">
    team?: { name: string } | null
  }
  event: {
    minTeamSize: number
    maxTeamSize: number
    status: string
  }
}

export function TeamTab({ eventId, participation, event }: TeamTabProps) {
  const team = useQuery(api.teams.getMyTeam, { eventId })

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

  const canModifyTeam = event.status !== "completed" && event.status !== "judging"

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return

    setIsCreating(true)
    try {
      await createTeam({ eventId, name: teamName.trim() })
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
      await joinTeamViaCode({ eventId, inviteCode: joinCode.trim().toUpperCase() })
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
      await leaveTeam({ eventId })
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No team - show create/join options
  if (!team) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a Team</CardTitle>
            <CardDescription>
              Start a new team and invite others to join. Team size: {event.minTeamSize}-
              {event.maxTeamSize} members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!canModifyTeam}>
                  <Plus className="mr-2 size-4" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join a Team</CardTitle>
            <CardDescription>
              Have an invite code? Enter it to join an existing team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={!canModifyTeam}>
                  <Users className="mr-2 size-4" />
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
          </CardContent>
        </Card>

        {!canModifyTeam && (
          <div className="col-span-full">
            <p className="text-center text-sm text-muted-foreground">
              Team modifications are disabled after the event has ended.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Has team - show team details
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {team.name}
                {team.isLeader && (
                  <Badge variant="outline" className="gap-1">
                    <Crown className="size-3" />
                    Leader
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {team.members.length} / {event.maxTeamSize} members
              </CardDescription>
            </div>
            {canModifyTeam && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLeaving}>
                    {isLeaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    Leave Team
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
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {team.isLeader && canModifyTeam && (
            <div className="flex flex-col gap-2">
              <Label>Team Invite Code</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
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
              <p className="text-xs text-muted-foreground">
                Share this code with others to invite them to your team.
              </p>
            </div>
          )}

          <div>
            <h4 className="mb-3 font-medium">Team Members</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      {member.user?.clerkId ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      {member.isLeader ? (
                        <Badge variant="outline" className="gap-1">
                          <Crown className="size-3" />
                          Leader
                        </Badge>
                      ) : (
                        "Member"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
