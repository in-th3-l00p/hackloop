"use client"

import { use, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { ArrowLeft, Loader2, Trash2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react"

function formatDateForInput(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

interface EventFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  minTeamSize: string
  maxTeamSize: string
  themeTitle: string
  themeDescription: string
}

export default function EventSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const event = useQuery(api.events.getBySlug, { slug })
  const updateEvent = useMutation(api.events.update)
  const deleteEvent = useMutation(api.events.remove)

  const [formData, setFormData] = useState<EventFormData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (event && !formData) {
      setFormData({
        name: event.name,
        description: event.description,
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        minTeamSize: event.minTeamSize.toString(),
        maxTeamSize: event.maxTeamSize.toString(),
        themeTitle: event.theme?.title ?? "",
        themeDescription: event.theme?.description ?? "",
      })
    }
  }, [event, formData])

  if (event === undefined) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (event === null) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button asChild>
          <Link href="/admin/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
    setError(null)
    setSuccess(false)
  }

  const handleReset = () => {
    setFormData({
      name: event.name,
      description: event.description,
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      minTeamSize: event.minTeamSize.toString(),
      maxTeamSize: event.maxTeamSize.toString(),
      themeTitle: event.theme?.title ?? "",
      themeDescription: event.theme?.description ?? "",
    })
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        await updateEvent({
          id: event._id,
          name: formData.name,
          description: formData.description,
          startDate: new Date(formData.startDate).getTime(),
          endDate: new Date(formData.endDate).getTime(),
          minTeamSize: parseInt(formData.minTeamSize, 10),
          maxTeamSize: parseInt(formData.maxTeamSize, 10),
          theme: formData.themeTitle
            ? {
                title: formData.themeTitle,
                description: formData.themeDescription || undefined,
              }
            : undefined,
        })

        setSuccess(true)

        if (formData.name !== event.name) {
          const newSlug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
          router.replace(`/admin/events/${newSlug}/settings`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update event")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEvent({ id: event._id })
        router.push("/admin/events")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete event")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${slug}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Event Settings</h1>
            <p className="text-sm text-muted-foreground">Update event configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 size-4" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will discard all unsaved changes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700 dark:text-green-400 [&>svg]:text-green-500">
            <CheckCircle2 className="size-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Event updated successfully</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-1">Basic Information</h2>
            <p className="text-sm font-light text-muted-foreground mb-4">Event name and description</p>
            <div className="space-y-4 pb-8 border-b">
              <div className="grid gap-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="Spring Hackathon 2025"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Markdown)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your hackathon..."
                  className="min-h-24"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1">Schedule & Teams</h2>
            <p className="text-sm font-light text-muted-foreground mb-4">Set event dates and team size limits</p>
            <div className="space-y-4 pb-8 border-b">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="minTeamSize">Min Team Size</Label>
                  <Input
                    id="minTeamSize"
                    type="number"
                    min="1"
                    value={formData.minTeamSize}
                    onChange={(e) => handleChange("minTeamSize", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxTeamSize">Max Team Size</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    min="1"
                    value={formData.maxTeamSize}
                    onChange={(e) => handleChange("maxTeamSize", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1">Theme</h2>
            <p className="text-sm font-light text-muted-foreground mb-4">Define the theme for your hackathon (optional)</p>
            <div className="space-y-4 pb-8 border-b">
              <div className="grid gap-2">
                <Label htmlFor="themeTitle">Theme Title</Label>
                <Input
                  id="themeTitle"
                  placeholder="e.g., Sustainability"
                  value={formData.themeTitle}
                  onChange={(e) => handleChange("themeTitle", e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="themeDescription">Theme Description</Label>
                <Textarea
                  id="themeDescription"
                  placeholder="Describe the theme..."
                  className="min-h-20"
                  value={formData.themeDescription}
                  onChange={(e) => handleChange("themeDescription", e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1 text-destructive">Delete this event</h2>
            <p className="text-sm font-light text-muted-foreground mb-4">
              Once deleted, all data including teams, submissions, and scores will be permanently removed.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  <Trash2 className="mr-2 size-4" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{event.name}&quot; and all associated data
                    including teams, submissions, and scores. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-4 pt-8 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href={`/admin/events/${slug}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
