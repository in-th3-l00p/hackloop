"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react"

const STORAGE_KEY = "loophack-new-event-form"

interface EventFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  minTeamSize: string
  maxTeamSize: string
  status: "draft" | "published"
  themeTitle: string
  themeDescription: string
}

const defaultFormData: EventFormData = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  minTeamSize: "1",
  maxTeamSize: "4",
  status: "draft",
  themeTitle: "",
  themeDescription: "",
}

export default function NewEventPage() {
  const router = useRouter()
  const createEvent = useMutation(api.events.create)
  const [formData, setFormData] = useState<EventFormData>(defaultFormData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setFormData(JSON.parse(saved))
      } catch {
        setFormData(defaultFormData)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    }
  }, [formData, isLoaded])

  const handleChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleReset = () => {
    setFormData(defaultFormData)
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const result = await createEvent({
          name: formData.name,
          description: formData.description,
          startDate: new Date(formData.startDate).getTime(),
          endDate: new Date(formData.endDate).getTime(),
          minTeamSize: parseInt(formData.minTeamSize, 10),
          maxTeamSize: parseInt(formData.maxTeamSize, 10),
          status: formData.status,
          theme: formData.themeTitle
            ? {
                title: formData.themeTitle,
                description: formData.themeDescription || undefined,
              }
            : undefined,
        })

        localStorage.removeItem(STORAGE_KEY)
        router.push(`/admin/events/${result.slug}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create event")
      }
    })
  }

  if (!isLoaded) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Event</h1>
            <p className="text-sm text-muted-foreground">Set up a new hackathon event</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="mr-2 size-4" />
              Reset Form
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset form?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all form data and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
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

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Event
          </Button>
          <Button type="button" variant="outline" asChild disabled={isPending}>
            <Link href="/admin/events">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
