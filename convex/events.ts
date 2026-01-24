import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"

const eventStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("active"),
  v.literal("judging"),
  v.literal("completed")
)

async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique()

  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  return user
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const events = await ctx.db.query("events").order("desc").collect()

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const participants = await ctx.db
          .query("eventParticipants")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect()

        return {
          ...event,
          participantCount: participants.length,
        }
      })
    )

    return eventsWithCounts
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique()

    if (!event) {
      return null
    }

    const [participants, teams, submissions] = await Promise.all([
      ctx.db
        .query("eventParticipants")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("submissions")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
    ])

    return {
      ...event,
      participantCount: participants.length,
      teamCount: teams.length,
      submissionCount: submissions.filter((s) => s.status === "submitted").length,
    }
  },
})

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    minTeamSize: v.number(),
    maxTeamSize: v.number(),
    status: v.union(v.literal("draft"), v.literal("published")),
    theme: v.optional(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)

    let slug = generateSlug(args.name)

    let existingEvent = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique()

    let counter = 1
    while (existingEvent) {
      slug = `${generateSlug(args.name)}-${counter}`
      existingEvent = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()
      counter++
    }

    const duration = args.endDate - args.startDate

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      slug,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      duration,
      minTeamSize: args.minTeamSize,
      maxTeamSize: args.maxTeamSize,
      status: args.status,
      theme: args.theme
        ? {
            title: args.theme.title,
            description: args.theme.description,
          }
        : undefined,
      createdBy: user._id,
    })

    return { eventId, slug }
  },
})

export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    minTeamSize: v.optional(v.number()),
    maxTeamSize: v.optional(v.number()),
    status: v.optional(eventStatusValidator),
    theme: v.optional(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        documentId: v.optional(v.id("_storage")),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const { id, ...updates } = args

    const event = await ctx.db.get(id)
    if (!event) {
      throw new Error("Event not found")
    }

    const finalUpdates: Record<string, unknown> = { ...updates }

    const newStartDate = updates.startDate ?? event.startDate
    const newEndDate = updates.endDate ?? event.endDate
    if (updates.startDate !== undefined || updates.endDate !== undefined) {
      finalUpdates.duration = newEndDate - newStartDate
    }

    if (updates.name && updates.name !== event.name) {
      let slug = generateSlug(updates.name)
      let existingEvent = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()

      let counter = 1
      while (existingEvent && existingEvent._id !== id) {
        slug = `${generateSlug(updates.name)}-${counter}`
        existingEvent = await ctx.db
          .query("events")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique()
        counter++
      }

      finalUpdates.slug = slug
    }

    await ctx.db.patch(id, finalUpdates)

    return id
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("events"),
    status: eventStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.id)
    if (!event) {
      throw new Error("Event not found")
    }

    const isStarting = args.status === "active" && event.status !== "active"
    const isStopping = args.status === "completed" && event.status === "active"

    if (isStarting) {
      await ctx.db.patch(args.id, {
        status: args.status,
        startedAt: Date.now(),
        pausedAt: undefined,
        elapsedBeforePause: undefined,
      })
    } else if (isStopping) {
      const now = Date.now()
      const elapsed = event.startedAt ? now - event.startedAt : 0
      await ctx.db.patch(args.id, {
        status: args.status,
        pausedAt: now,
        elapsedBeforePause: (event.elapsedBeforePause ?? 0) + elapsed,
      })
    } else {
      await ctx.db.patch(args.id, { status: args.status })
    }

    return args.id
  },
})

export const resumeTimer = mutation({
  args: {
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.id)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status !== "completed") {
      throw new Error("Can only resume a stopped event")
    }

    const elapsed = event.elapsedBeforePause ?? 0
    const remaining = event.duration - elapsed

    if (remaining <= 0) {
      throw new Error("No time remaining to resume")
    }

    await ctx.db.patch(args.id, {
      status: "active",
      startedAt: Date.now(),
      pausedAt: undefined,
    })

    return args.id
  },
})

export const modifyTimer = mutation({
  args: {
    id: v.id("events"),
    newDuration: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.id)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status !== "active") {
      throw new Error("Can only modify timer for active events")
    }

    if (args.newDuration <= 0) {
      throw new Error("Duration must be positive")
    }

    await ctx.db.patch(args.id, {
      duration: args.newDuration,
      elapsedBeforePause: 0,
    })

    return args.id
  },
})

export const extendTimer = mutation({
  args: {
    id: v.id("events"),
    additionalTime: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.id)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status !== "active" && event.status !== "completed") {
      throw new Error("Can only extend timer for active or completed events")
    }

    if (args.additionalTime <= 0) {
      throw new Error("Additional time must be positive")
    }

    const newDuration = event.duration + args.additionalTime

    if (event.status === "completed") {
      await ctx.db.patch(args.id, {
        status: "active",
        duration: newDuration,
        startedAt: Date.now(),
        pausedAt: undefined,
      })
    } else {
      await ctx.db.patch(args.id, {
        duration: newDuration,
      })
    }

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.id)
    if (!event) {
      throw new Error("Event not found")
    }

    const [participants, teams, submissions, staff, announcements, criteria, messages] =
      await Promise.all([
        ctx.db
          .query("eventParticipants")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
        ctx.db
          .query("teams")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
        ctx.db
          .query("submissions")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
        ctx.db
          .query("eventStaff")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
        ctx.db
          .query("announcements")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
        ctx.db
          .query("judgingCriteria")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
        ctx.db
          .query("chatMessages")
          .withIndex("by_event", (q) => q.eq("eventId", args.id))
          .collect(),
      ])

    for (const submission of submissions) {
      const scores = await ctx.db
        .query("scores")
        .withIndex("by_submission", (q) => q.eq("submissionId", submission._id))
        .collect()
      for (const score of scores) {
        await ctx.db.delete(score._id)
      }
    }

    await Promise.all([
      ...participants.map((p) => ctx.db.delete(p._id)),
      ...teams.map((t) => ctx.db.delete(t._id)),
      ...submissions.map((s) => ctx.db.delete(s._id)),
      ...staff.map((s) => ctx.db.delete(s._id)),
      ...announcements.map((a) => ctx.db.delete(a._id)),
      ...criteria.map((c) => ctx.db.delete(c._id)),
      ...messages.map((m) => ctx.db.delete(m._id)),
    ])

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const getStats = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.id)
    if (!event) {
      throw new Error("Event not found")
    }

    const [participants, teams, submissions, staff] = await Promise.all([
      ctx.db
        .query("eventParticipants")
        .withIndex("by_event", (q) => q.eq("eventId", args.id))
        .collect(),
      ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", args.id))
        .collect(),
      ctx.db
        .query("submissions")
        .withIndex("by_event", (q) => q.eq("eventId", args.id))
        .collect(),
      ctx.db
        .query("eventStaff")
        .withIndex("by_event", (q) => q.eq("eventId", args.id))
        .collect(),
    ])

    const submittedCount = submissions.filter((s) => s.status === "submitted").length
    const draftCount = submissions.filter((s) => s.status === "draft").length
    const judges = staff.filter((s) => s.isJudge)

    return {
      participantCount: participants.length,
      teamCount: teams.length,
      submissionCount: submittedCount,
      draftSubmissionCount: draftCount,
      judgeCount: judges.length,
      staffCount: staff.length,
    }
  },
})

// Get event by slug for participants (public access to basic info)
export const getEventBySlugForParticipant = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique()

    if (!event) return null

    // Get participant count
    const participants = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect()

    // Get team count
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect()

    // Get announcements
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_event_and_created", (q) => q.eq("eventId", event._id))
      .order("desc")
      .take(10)

    // Get announcement authors
    const announcementsWithAuthors = await Promise.all(
      announcements.map(async (a) => {
        const author = await ctx.db.get(a.authorId)
        return {
          ...a,
          authorName: author?.clerkId ?? "Unknown",
        }
      })
    )

    return {
      _id: event._id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      duration: event.duration,
      startedAt: event.startedAt,
      pausedAt: event.pausedAt,
      elapsedBeforePause: event.elapsedBeforePause,
      minTeamSize: event.minTeamSize,
      maxTeamSize: event.maxTeamSize,
      theme: event.theme,
      participantCount: participants.length,
      teamCount: teams.length,
      announcements: announcementsWithAuthors,
    }
  },
})

// Get events the current user is participating in (for hacker dashboard)
export const getMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return []
    }

    // Get all events the user is participating in
    const participations = await ctx.db
      .query("eventParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    // Get event details and team info for each participation
    const eventsWithDetails = await Promise.all(
      participations.map(async (participation) => {
        const event = await ctx.db.get(participation.eventId)
        if (!event) return null

        // Get team name if participant is on a team
        let teamName: string | null = null
        if (participation.teamId) {
          const team = await ctx.db.get(participation.teamId)
          teamName = team?.name ?? null
        }

        // Get participant count for the event
        const participants = await ctx.db
          .query("eventParticipants")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect()

        // Calculate time remaining for active events
        let timeRemaining: number | null = null
        if (event.status === "active" && event.startedAt) {
          const elapsed = (event.elapsedBeforePause ?? 0) + (Date.now() - event.startedAt)
          timeRemaining = Math.max(0, event.duration - elapsed)
        }

        return {
          _id: event._id,
          name: event.name,
          slug: event.slug,
          description: event.description,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          duration: event.duration,
          startedAt: event.startedAt,
          teamName,
          participantCount: participants.length,
          timeRemaining,
          joinedAt: participation.joinedAt,
        }
      })
    )

    // Filter out nulls and sort: active first, then published (upcoming), then rest
    const validEvents = eventsWithDetails.filter((e) => e !== null)

    const statusOrder: Record<string, number> = {
      active: 0,
      published: 1,
      judging: 2,
      completed: 3,
      draft: 4,
    }

    validEvents.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      // Within same status, sort by start date (newest first for active/published, oldest first for completed)
      if (a.status === "completed" || a.status === "judging") {
        return b.startDate - a.startDate // Most recent completed first
      }
      return a.startDate - b.startDate // Soonest upcoming first
    })

    return validEvents
  },
})

export const checkAndCompleteEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()

    let completedCount = 0

    for (const event of activeEvents) {
      if (!event.startedAt) continue

      const elapsed = now - event.startedAt
      const remaining = event.duration - elapsed

      if (remaining <= 0) {
        await ctx.db.patch(event._id, {
          status: "completed",
        })
        completedCount++
      }
    }

    return { completedCount }
  },
})
