"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Loader2,
  MoreHorizontal,
  Eye,
  Ban,
  RotateCcw,
  ExternalLink,
  Github,
  Video,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  FileText,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { UserAvatar } from "@/components/user-avatar"
import { toast } from "sonner"

interface SubmissionsTabProps {
  eventId: Id<"events">
}

type SubmissionStatus = "draft" | "submitted" | "disqualified"

const statusConfig: Record<SubmissionStatus, { label: string; icon: React.ReactNode; className: string }> = {
  submitted: {
    label: "Submitted",
    icon: <CheckCircle2 className="size-3" />,
    className: "bg-green-100 text-green-700",
  },
  draft: {
    label: "Draft",
    icon: <Clock className="size-3" />,
    className: "bg-yellow-100 text-yellow-700",
  },
  disqualified: {
    label: "Disqualified",
    icon: <XCircle className="size-3" />,
    className: "bg-red-100 text-red-700",
  },
}

export function SubmissionsTab({ eventId }: SubmissionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [disqualifyTarget, setDisqualifyTarget] = useState<Id<"submissions"> | null>(null)

  const submissions = useQuery(api.submissions.getEventSubmissions, { eventId })
  const disqualifySubmission = useMutation(api.submissions.disqualifySubmission)
  const reinstateSubmission = useMutation(api.submissions.reinstateSubmission)

  const handleDisqualify = async () => {
    if (!disqualifyTarget) return
    try {
      await disqualifySubmission({ submissionId: disqualifyTarget })
      toast.success("Submission disqualified")
      setDisqualifyTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disqualify")
    }
  }

  const handleReinstate = async (submissionId: Id<"submissions">) => {
    try {
      await reinstateSubmission({ submissionId })
      toast.success("Submission reinstated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reinstate")
    }
  }

  if (!submissions) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      submission.title.toLowerCase().includes(query) ||
      submission.teamName.toLowerCase().includes(query) ||
      submission.leaderName.toLowerCase().includes(query)
    )
  })

  const submittedCount = submissions.filter((s) => s.status === "submitted").length
  const draftCount = submissions.filter((s) => s.status === "draft").length
  const disqualifiedCount = submissions.filter((s) => s.status === "disqualified").length

  const selectedSubmissionData = submissions.find((s) => s._id === selectedSubmission)

  return (
    <div className="flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-t"></div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3" />
            {submittedCount} Submitted
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            {draftCount} Drafts
          </Badge>
        </div>
        {disqualifiedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="gap-1">
              <XCircle className="size-3" />
              {disqualifiedCount} Disqualified
            </Badge>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by project or team name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Links</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="size-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {submissions.length === 0
                        ? "No submissions yet"
                        : "No submissions match your search"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => {
                const status = statusConfig[submission.status as SubmissionStatus]
                return (
                  <TableRow key={submission._id}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate font-medium">{submission.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {submission.description.slice(0, 60)}
                          {submission.description.length > 60 ? "..." : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {submission.leader && (
                          <UserAvatar
                            name={submission.leader.name}
                            imageUrl={submission.leader.imageUrl}
                            size="sm"
                          />
                        )}
                        <div>
                          <p className="font-medium">{submission.teamName}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            {submission.teamMemberCount} members
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {submission.demoUrl && (
                          <a
                            href={submission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1.5 hover:bg-muted"
                            title="Demo"
                          >
                            <Globe className="size-4 text-muted-foreground" />
                          </a>
                        )}
                        {submission.repoUrl && (
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1.5 hover:bg-muted"
                            title="Repository"
                          >
                            <Github className="size-4 text-muted-foreground" />
                          </a>
                        )}
                        {submission.videoUrl && (
                          <a
                            href={submission.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1.5 hover:bg-muted"
                            title="Video"
                          >
                            <Video className="size-4 text-muted-foreground" />
                          </a>
                        )}
                        {!submission.demoUrl && !submission.repoUrl && !submission.videoUrl && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {submission.submittedAt
                        ? formatDistanceToNow(submission.submittedAt, { addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="size-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedSubmission(submission._id)}>
                            <Eye className="size-4" />
                            View Details
                          </DropdownMenuItem>
                          {submission.status === "disqualified" ? (
                            <DropdownMenuItem onClick={() => handleReinstate(submission._id)}>
                              <RotateCcw className="size-4" />
                              Reinstate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setDisqualifyTarget(submission._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="size-4" />
                              Disqualify
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSubmissionData?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedSubmissionData?.teamName}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmissionData && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <Badge
                  className={`gap-1 ${statusConfig[selectedSubmissionData.status as SubmissionStatus].className}`}
                >
                  {statusConfig[selectedSubmissionData.status as SubmissionStatus].icon}
                  {statusConfig[selectedSubmissionData.status as SubmissionStatus].label}
                </Badge>
                {selectedSubmissionData.submittedAt && (
                  <span className="text-sm text-muted-foreground">
                    Submitted{" "}
                    {formatDistanceToNow(selectedSubmissionData.submittedAt, { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Team Info */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {selectedSubmissionData.leader && (
                    <UserAvatar
                      name={selectedSubmissionData.leader.name}
                      imageUrl={selectedSubmissionData.leader.imageUrl}
                      size="md"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedSubmissionData.teamName}</p>
                    <p className="text-sm text-muted-foreground">
                      Led by {selectedSubmissionData.leaderName} •{" "}
                      {selectedSubmissionData.teamMemberCount} members
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedSubmissionData.description}</p>
              </div>

              {/* Links */}
              {(selectedSubmissionData.demoUrl ||
                selectedSubmissionData.repoUrl ||
                selectedSubmissionData.videoUrl) && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmissionData.demoUrl && (
                      <a
                        href={selectedSubmissionData.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Globe className="size-4" />
                        Demo
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                    {selectedSubmissionData.repoUrl && (
                      <a
                        href={selectedSubmissionData.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Github className="size-4" />
                        Repository
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                    {selectedSubmissionData.videoUrl && (
                      <a
                        href={selectedSubmissionData.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Video className="size-4" />
                        Video
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disqualify Confirmation */}
      <AlertDialog open={!!disqualifyTarget} onOpenChange={() => setDisqualifyTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disqualify submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the submission as disqualified. The team will not be able to win or be
              judged. You can reinstate the submission later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisqualify} className="bg-destructive hover:bg-destructive/90">
              Disqualify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
