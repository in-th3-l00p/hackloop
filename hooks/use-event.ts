"use client"

import { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

type EventStatus = "draft" | "published" | "active" | "judging" | "completed"

interface Event {
  _id: Id<"events">
  name: string
  slug: string
  description: string
  startDate: number
  endDate: number
  duration: number
  startedAt?: number
  minTeamSize: number
  maxTeamSize: number
  status: EventStatus
  participantCount: number
  teamCount: number
  submissionCount: number
}

interface UseEventReturn {
  event: Event | null | undefined
  isLoading: boolean
  isPending: boolean
  isPreStart: boolean
  isActive: boolean
  isStopped: boolean
  isPublished: boolean
  dialogs: {
    earlyStart: boolean
    stop: boolean
    delete: boolean
  }
  actions: {
    publish: () => void
    unpublish: () => void
    togglePublish: (checked: boolean) => void
    start: () => void
    confirmEarlyStart: () => void
    cancelEarlyStart: () => void
    stop: () => void
    confirmStop: () => void
    cancelStop: () => void
    restart: () => void
    remove: () => void
    confirmDelete: () => void
    cancelDelete: () => void
  }
}

export function useEvent(slug: string): UseEventReturn {
  const router = useRouter()
  const event = useQuery(api.events.getBySlug, { slug })
  const updateStatus = useMutation(api.events.updateStatus)
  const deleteEvent = useMutation(api.events.remove)

  const [isPending, startTransition] = useTransition()
  const [showEarlyStartDialog, setShowEarlyStartDialog] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isLoading = event === undefined
  const isPreStart = event?.status === "draft" || event?.status === "published"
  const isActive = event?.status === "active"
  const isStopped = event?.status === "completed"
  const isPublished = event?.status === "published"

  const changeStatus = useCallback(
    (newStatus: EventStatus) => {
      if (!event) return
      startTransition(async () => {
        await updateStatus({ id: event._id, status: newStatus })
      })
    },
    [event, updateStatus]
  )

  const publish = useCallback(() => changeStatus("published"), [changeStatus])
  const unpublish = useCallback(() => changeStatus("draft"), [changeStatus])
  const togglePublish = useCallback(
    (checked: boolean) => changeStatus(checked ? "published" : "draft"),
    [changeStatus]
  )

  const start = useCallback(() => {
    if (!event) return
    const now = Date.now()
    const isEarlyStart = now < event.startDate

    if (isEarlyStart) {
      setShowEarlyStartDialog(true)
    } else {
      changeStatus("active")
    }
  }, [event, changeStatus])

  const confirmEarlyStart = useCallback(() => {
    changeStatus("active")
    setShowEarlyStartDialog(false)
  }, [changeStatus])

  const cancelEarlyStart = useCallback(() => {
    setShowEarlyStartDialog(false)
  }, [])

  const stop = useCallback(() => {
    setShowStopDialog(true)
  }, [])

  const confirmStop = useCallback(() => {
    changeStatus("completed")
    setShowStopDialog(false)
  }, [changeStatus])

  const cancelStop = useCallback(() => {
    setShowStopDialog(false)
  }, [])

  const restart = useCallback(() => {
    changeStatus("active")
  }, [changeStatus])

  const remove = useCallback(() => {
    setShowDeleteDialog(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!event) return
    startTransition(async () => {
      await deleteEvent({ id: event._id })
      router.push("/admin/events")
    })
  }, [event, deleteEvent, router])

  const cancelDelete = useCallback(() => {
    setShowDeleteDialog(false)
  }, [])

  return {
    event,
    isLoading,
    isPending,
    isPreStart,
    isActive,
    isStopped,
    isPublished,
    dialogs: {
      earlyStart: showEarlyStartDialog,
      stop: showStopDialog,
      delete: showDeleteDialog,
    },
    actions: {
      publish,
      unpublish,
      togglePublish,
      start,
      confirmEarlyStart,
      cancelEarlyStart,
      stop,
      confirmStop,
      cancelStop,
      restart,
      remove,
      confirmDelete,
      cancelDelete,
    },
  }
}
