"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Link2,
  Copy,
  RefreshCw,
  Check,
  X,
  Users,
  Loader2,
  Crown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface TeamsTabProps {
  eventId: Id<"events">
  eventSlug: string
}

export function TeamsTab({ eventId, eventSlug }: TeamsTabProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [selectedRequests, setSelectedRequests] = useState<Set<Id<"joinRequests">>>(new Set())
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null)

  // Queries
  const joinSettings = useQuery(api.participants.getJoinSettings, { eventId })
  const pendingRequests = useQuery(api.participants.getPendingRequests, { eventId })
  const acceptedParticipants = useQuery(api.participants.getAcceptedParticipants, { eventId })
  const teams = useQuery(api.participants.getTeamsWithMemberCount, { eventId })
  const teamMembers = useQuery(
    api.participants.getTeamMembers,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  )

  // Mutations
  const updateJoinSettings = useMutation(api.participants.updateJoinSettings)
  const regenerateInviteCode = useMutation(api.participants.regenerateInviteCode)
  const acceptRequest = useMutation(api.participants.acceptRequest)
  const rejectRequest = useMutation(api.participants.rejectRequest)
  const batchAcceptRequests = useMutation(api.participants.batchAcceptRequests)
  const batchRejectRequests = useMutation(api.participants.batchRejectRequests)
  const removeParticipant = useMutation(api.participants.removeParticipant)

  const inviteLink = joinSettings?.inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/join/${eventSlug}?code=${joinSettings.inviteCode}`
    : null

  const handleCopyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleToggleInviteLink = (checked: boolean) => {
    updateJoinSettings({ eventId, inviteLinkEnabled: checked })
  }

  const handleTogglePublicJoin = (checked: boolean) => {
    updateJoinSettings({ eventId, publicJoinEnabled: checked })
  }

  const handleToggleAutoAccept = (checked: boolean) => {
    updateJoinSettings({ eventId, autoAcceptEnabled: checked })
  }

  const handleRegenerateCode = () => {
    regenerateInviteCode({ eventId })
  }

  const handleSelectRequest = (requestId: Id<"joinRequests">, checked: boolean) => {
    const newSelected = new Set(selectedRequests)
    if (checked) {
      newSelected.add(requestId)
    } else {
      newSelected.delete(requestId)
    }
    setSelectedRequests(newSelected)
  }

  const handleSelectAllRequests = (checked: boolean) => {
    if (checked && pendingRequests) {
      setSelectedRequests(new Set(pendingRequests.map((r) => r._id)))
    } else {
      setSelectedRequests(new Set())
    }
  }

  const handleBatchAccept = async () => {
    if (selectedRequests.size > 0) {
      await batchAcceptRequests({ requestIds: Array.from(selectedRequests) })
      setSelectedRequests(new Set())
    }
  }

  const handleBatchReject = async () => {
    if (selectedRequests.size > 0) {
      await batchRejectRequests({ requestIds: Array.from(selectedRequests) })
      setSelectedRequests(new Set())
    }
  }

  if (!joinSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Section 1: Join Settings */}
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold">Join Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure how participants can join this event
          </p>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          {/* Invite Link */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Invite Link</Label>
              <p className="text-sm text-muted-foreground">
                Generate a unique link for invited participants
              </p>
            </div>
            <Switch
              checked={joinSettings.inviteLinkEnabled}
              onCheckedChange={handleToggleInviteLink}
            />
          </div>

          {joinSettings.inviteLinkEnabled && inviteLink && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <Link2 className="size-4 text-muted-foreground" />
                <Input
                  value={inviteLink}
                  readOnly
                  className="h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Copy link"
              >
                {copiedLink ? (
                  <Check className="size-4 text-green-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerateCode}
                title="Regenerate code"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          )}

          <div className="border-t pt-4" />

          {/* Public Join */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Public Join Requests</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to request to join from the event page
              </p>
            </div>
            <Switch
              checked={joinSettings.publicJoinEnabled}
              onCheckedChange={handleTogglePublicJoin}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Pending Requests */}
      {joinSettings.publicJoinEnabled && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Pending Requests</h2>
              <p className="text-sm text-muted-foreground">
                Review and manage join requests
              </p>
            </div>
            {selectedRequests.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBatchAccept}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="size-4" />
                  Accept ({selectedRequests.size})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBatchReject}
                >
                  <X className="size-4" />
                  Reject ({selectedRequests.size})
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        pendingRequests &&
                        pendingRequests.length > 0 &&
                        selectedRequests.size === pendingRequests.length
                      }
                      onCheckedChange={handleSelectAllRequests}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!pendingRequests || pendingRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No pending requests
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.has(request._id)}
                          onCheckedChange={(checked) =>
                            handleSelectRequest(request._id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(request.requestedAt, { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => acceptRequest({ requestId: request._id })}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => rejectRequest({ requestId: request._id })}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Auto Accept Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto Accept</Label>
              <p className="text-sm text-muted-foreground">
                Automatically accept all join requests
              </p>
            </div>
            <Switch
              checked={joinSettings.autoAcceptEnabled}
              onCheckedChange={handleToggleAutoAccept}
            />
          </div>
        </div>
      )}

      {/* Section 3: Accepted Participants */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Participants</h2>
          <p className="text-sm text-muted-foreground">
            {acceptedParticipants?.length ?? 0} registered participants
          </p>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!acceptedParticipants || acceptedParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No participants yet
                  </TableCell>
                </TableRow>
              ) : (
                acceptedParticipants.map((participant) => (
                  <TableRow key={participant._id}>
                    <TableCell className="font-medium">
                      {participant.user?.clerkId ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      {participant.teamId ? (
                        <Badge variant="secondary">In team</Badge>
                      ) : (
                        <span className="text-muted-foreground">No team</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(participant.joinedAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => removeParticipant({ participantId: participant._id })}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 4: Teams */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">
            {teams?.length ?? 0} teams created
          </p>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!teams || teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No teams yet
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.leaderName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="size-4 text-muted-foreground" />
                        {team.memberCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTeamId(team._id)}
                      >
                        View Members
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Team Members Dialog */}
      <Dialog open={!!selectedTeamId} onOpenChange={() => setSelectedTeamId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{teamMembers?.team.name ?? "Team"}</DialogTitle>
            <DialogDescription>
              {teamMembers?.members.length ?? 0} members in this team
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers?.members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      {member.user?.clerkId ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      {member.isLeader ? (
                        <Badge className="gap-1">
                          <Crown className="size-3" />
                          Leader
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Member</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(member.joinedAt, { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
