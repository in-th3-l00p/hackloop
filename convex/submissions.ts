import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

// Get current user helper
async function getCurrentUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique()

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

// Get submission for a team
export const getTeamSubmission = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first()
  },
})

// Get my team's submission
export const getMySubmission = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) return null

    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation || !participation.teamId) return null

    const teamId = participation.teamId
    return await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .first()
  },
})

// Create or update submission (draft)
export const saveSubmission = mutation({
  args: {
    eventId: v.id("events"),
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    demoUrl: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Verify user is in the team
    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation || participation.teamId !== args.teamId) {
      throw new Error("You are not a member of this team")
    }

    // Check event status
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status === "completed" || event.status === "judging") {
      throw new Error("Cannot modify submissions after the event has ended")
    }

    // Check for existing submission
    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first()

    if (existingSubmission) {
      // Update existing
      await ctx.db.patch(existingSubmission._id, {
        title: args.title,
        description: args.description,
        demoUrl: args.demoUrl,
        repoUrl: args.repoUrl,
        videoUrl: args.videoUrl,
      })
      return existingSubmission._id
    } else {
      // Create new
      return await ctx.db.insert("submissions", {
        eventId: args.eventId,
        teamId: args.teamId,
        title: args.title,
        description: args.description,
        demoUrl: args.demoUrl,
        repoUrl: args.repoUrl,
        videoUrl: args.videoUrl,
        status: "draft",
      })
    }
  },
})

// Submit (finalize) a submission
export const submitSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const submission = await ctx.db.get(args.submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }

    // Verify user is in the team
    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", submission.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation || participation.teamId !== submission.teamId) {
      throw new Error("You are not a member of this team")
    }

    // Check event status
    const event = await ctx.db.get(submission.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status !== "active") {
      throw new Error("Submissions can only be made during an active event")
    }

    // Check required fields
    if (!submission.title || !submission.description) {
      throw new Error("Title and description are required")
    }

    await ctx.db.patch(args.submissionId, {
      status: "submitted",
      submittedAt: Date.now(),
    })

    return args.submissionId
  },
})

// Get all submissions for an event (admin)
export const getEventSubmissions = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Get team info for each submission
    const submissionsWithTeams = await Promise.all(
      submissions.map(async (submission) => {
        const team = await ctx.db.get(submission.teamId)
        if (!team) {
          return {
            ...submission,
            teamName: "Unknown Team",
            teamMemberCount: 0,
            leaderName: "Unknown",
            leader: null,
          }
        }

        // Get team members count
        const members = await ctx.db
          .query("eventParticipants")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect()

        // Get leader info
        const leader = await ctx.db.get(team.leaderId)

        return {
          ...submission,
          teamName: team.name,
          teamMemberCount: members.length,
          leaderName: leader?.name ?? leader?.clerkId ?? "Unknown",
          leader: leader
            ? {
                _id: leader._id,
                name: leader.name,
                email: leader.email,
                imageUrl: leader.imageUrl,
              }
            : null,
        }
      })
    )

    // Sort: submitted first (by submittedAt desc), then drafts
    return submissionsWithTeams.sort((a, b) => {
      if (a.status === "submitted" && b.status !== "submitted") return -1
      if (a.status !== "submitted" && b.status === "submitted") return 1
      if (a.status === "submitted" && b.status === "submitted") {
        return (b.submittedAt ?? 0) - (a.submittedAt ?? 0)
      }
      return 0
    })
  },
})

// Disqualify a submission (admin)
export const disqualifySubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const submission = await ctx.db.get(args.submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }

    await ctx.db.patch(args.submissionId, {
      status: "disqualified",
    })

    return args.submissionId
  },
})

// Reinstate a disqualified submission (admin)
export const reinstateSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const submission = await ctx.db.get(args.submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }

    if (submission.status !== "disqualified") {
      throw new Error("Submission is not disqualified")
    }

    // Restore to submitted if it was submitted before, otherwise draft
    const newStatus = submission.submittedAt ? "submitted" : "draft"

    await ctx.db.patch(args.submissionId, {
      status: newStatus,
    })

    return args.submissionId
  },
})

// Unsubmit (return to draft)
export const unsubmitSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const submission = await ctx.db.get(args.submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }

    // Verify user is in the team
    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", submission.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation || participation.teamId !== submission.teamId) {
      throw new Error("You are not a member of this team")
    }

    // Check event status
    const event = await ctx.db.get(submission.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status !== "active") {
      throw new Error("Can only modify submissions during an active event")
    }

    await ctx.db.patch(args.submissionId, {
      status: "draft",
      submittedAt: undefined,
    })

    return args.submissionId
  },
})
