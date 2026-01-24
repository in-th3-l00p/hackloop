"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  FileText,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Undo2,
  Github,
  Video,
  Globe,
} from "lucide-react"
import { toast } from "sonner"

interface SubmissionTabProps {
  eventId: Id<"events">
  teamId?: Id<"teams">
  eventStatus: string
}

export function SubmissionTab({ eventId, teamId, eventStatus }: SubmissionTabProps) {
  const submission = useQuery(api.submissions.getMySubmission, { eventId })

  const saveSubmission = useMutation(api.submissions.saveSubmission)
  const submitSubmission = useMutation(api.submissions.submitSubmission)
  const unsubmitSubmission = useMutation(api.submissions.unsubmitSubmission)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [demoUrl, setDemoUrl] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnsubmitting, setIsUnsubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load submission data
  useEffect(() => {
    if (submission) {
      setTitle(submission.title || "")
      setDescription(submission.description || "")
      setDemoUrl(submission.demoUrl || "")
      setRepoUrl(submission.repoUrl || "")
      setVideoUrl(submission.videoUrl || "")
    }
  }, [submission])

  const canEdit = eventStatus === "active" || eventStatus === "published"
  const canSubmit = eventStatus === "active"
  const isSubmitted = submission?.status === "submitted"

  const handleSave = async () => {
    if (!teamId) return

    setIsSaving(true)
    try {
      await saveSubmission({
        eventId,
        teamId,
        title,
        description,
        demoUrl: demoUrl || undefined,
        repoUrl: repoUrl || undefined,
        videoUrl: videoUrl || undefined,
      })
      setLastSaved(new Date())
      toast.success("Draft saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!submission?._id) return

    setIsSubmitting(true)
    try {
      await submitSubmission({ submissionId: submission._id })
      setShowSubmitDialog(false)
      toast.success("Submission submitted!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnsubmit = async () => {
    if (!submission?._id) return

    setIsUnsubmitting(true)
    try {
      await unsubmitSubmission({ submissionId: submission._id })
      toast.success("Submission returned to draft")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unsubmit")
    } finally {
      setIsUnsubmitting(false)
    }
  }

  // No team
  if (!teamId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Join a Team First</h3>
        <p className="mt-2 max-w-md text-muted-foreground">
          You need to be part of a team to submit a project.
        </p>
      </div>
    )
  }

  // Loading
  if (submission === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Submitted state
  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-8">
        {/* Success Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Submission Complete</h2>
              <p className="text-sm text-muted-foreground">
                Submitted {submission.submittedAt && new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Badge className="gap-1 bg-green-100 text-green-700">
            <CheckCircle2 className="size-3" />
            Submitted
          </Badge>
        </div>

        {/* Project Details */}
        <div>
          <h3 className="text-2xl font-bold">{submission.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{submission.description}</p>
        </div>

        {/* Links */}
        {(submission.demoUrl || submission.repoUrl || submission.videoUrl) && (
          <div className="flex flex-wrap gap-3">
            {submission.demoUrl && (
              <a
                href={submission.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Globe className="size-4" />
                Demo
                <ExternalLink className="size-3" />
              </a>
            )}
            {submission.repoUrl && (
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Github className="size-4" />
                Repository
                <ExternalLink className="size-3" />
              </a>
            )}
            {submission.videoUrl && (
              <a
                href={submission.videoUrl}
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
        )}

        {canSubmit && (
          <Button
            variant="outline"
            onClick={handleUnsubmit}
            disabled={isUnsubmitting}
            className="w-fit"
          >
            {isUnsubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Undo2 className="mr-2 size-4" />
            )}
            Edit Submission
          </Button>
        )}
      </div>
    )
  }

  // Edit/Draft state
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Project Submission</h2>
            <p className="text-sm text-muted-foreground">
              {submission ? "Edit your submission" : "Create your submission"}
            </p>
          </div>
        </div>
        {submission && (
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            Draft
          </Badge>
        )}
      </div>

      {/* Form */}
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            placeholder="Enter your project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            className="text-lg"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe your project, what problem it solves, and how it works..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            disabled={!canEdit}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="demoUrl" className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              Demo URL
            </Label>
            <Input
              id="demoUrl"
              placeholder="https://..."
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="repoUrl" className="flex items-center gap-2">
              <Github className="size-4 text-muted-foreground" />
              Repository URL
            </Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="videoUrl" className="flex items-center gap-2">
              <Video className="size-4 text-muted-foreground" />
              Video URL
            </Label>
            <Input
              id="videoUrl"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save Draft
            </Button>

            {canSubmit && (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={!title.trim() || !description.trim()}
              >
                <Send className="mr-2 size-4" />
                Submit
              </Button>
            )}
          </div>
        </div>
      )}

      {!canEdit && (
        <p className="text-center text-sm text-muted-foreground">
          Submissions are locked. The event has ended.
        </p>
      )}

      {canEdit && !canSubmit && (
        <p className="text-center text-sm text-muted-foreground">
          You can save drafts, but submissions are only accepted when the event is live.
        </p>
      )}

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your project?</AlertDialogTitle>
            <AlertDialogDescription>
              Make sure your submission is complete. You can still edit it after submitting while
              the event is active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
