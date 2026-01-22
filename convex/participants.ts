import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

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

// Generate a random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Get join settings for an event
export const getJoinSettings = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) return null

    return {
      inviteLinkEnabled: event.inviteLinkEnabled ?? false,
      inviteCode: event.inviteCode,
      publicJoinEnabled: event.publicJoinEnabled ?? false,
      autoAcceptEnabled: event.autoAcceptEnabled ?? false,
    }
  },
})

// Update join settings
export const updateJoinSettings = mutation({
  args: {
    eventId: v.id("events"),
    inviteLinkEnabled: v.optional(v.boolean()),
    publicJoinEnabled: v.optional(v.boolean()),
    autoAcceptEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")

    const updates: Record<string, unknown> = {}

    if (args.inviteLinkEnabled !== undefined) {
      updates.inviteLinkEnabled = args.inviteLinkEnabled
      // Generate invite code if enabling and none exists
      if (args.inviteLinkEnabled && !event.inviteCode) {
        updates.inviteCode = generateInviteCode()
      }
    }

    if (args.publicJoinEnabled !== undefined) {
      updates.publicJoinEnabled = args.publicJoinEnabled
    }

    if (args.autoAcceptEnabled !== undefined) {
      updates.autoAcceptEnabled = args.autoAcceptEnabled
    }

    await ctx.db.patch(args.eventId, updates)
    return args.eventId
  },
})

// Regenerate invite code
export const regenerateInviteCode = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const newCode = generateInviteCode()
    await ctx.db.patch(args.eventId, { inviteCode: newCode })
    return newCode
  },
})

// Get pending join requests
export const getPendingRequests = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("joinRequests")
      .withIndex("by_event_and_status", (q) =>
        q.eq("eventId", args.eventId).eq("status", "pending")
      )
      .order("desc")
      .collect()
  },
})

// Get accepted participants (from eventParticipants table)
export const getAcceptedParticipants = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    // Get user details for each participant
    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId)
        return {
          ...p,
          user: user
            ? { _id: user._id, clerkId: user.clerkId }
            : null,
        }
      })
    )

    return participantsWithDetails
  },
})

// Accept a join request
export const acceptRequest = mutation({
  args: { requestId: v.id("joinRequests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Request not found")
    if (request.status !== "pending") throw new Error("Request already processed")

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      processedAt: Date.now(),
    })

    return args.requestId
  },
})

// Reject a join request
export const rejectRequest = mutation({
  args: { requestId: v.id("joinRequests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Request not found")
    if (request.status !== "pending") throw new Error("Request already processed")

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      processedAt: Date.now(),
    })

    return args.requestId
  },
})

// Batch accept requests
export const batchAcceptRequests = mutation({
  args: { requestIds: v.array(v.id("joinRequests")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const now = Date.now()
    await Promise.all(
      args.requestIds.map(async (id) => {
        const request = await ctx.db.get(id)
        if (request && request.status === "pending") {
          await ctx.db.patch(id, {
            status: "accepted",
            processedAt: now,
          })
        }
      })
    )

    return args.requestIds.length
  },
})

// Batch reject requests
export const batchRejectRequests = mutation({
  args: { requestIds: v.array(v.id("joinRequests")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const now = Date.now()
    await Promise.all(
      args.requestIds.map(async (id) => {
        const request = await ctx.db.get(id)
        if (request && request.status === "pending") {
          await ctx.db.patch(id, {
            status: "rejected",
            processedAt: now,
          })
        }
      })
    )

    return args.requestIds.length
  },
})

// Get teams with member count
export const getTeamsWithMemberCount = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()

    const teamsWithCount = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("eventParticipants")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect()

        const leader = await ctx.db.get(team.leaderId)

        return {
          ...team,
          memberCount: members.length,
          leaderName: leader?.clerkId ?? "Unknown",
        }
      })
    )

    return teamsWithCount
  },
})

// Get team members
export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId)
    if (!team) return null

    const members = await ctx.db
      .query("eventParticipants")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect()

    const membersWithDetails = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId)
        return {
          ...m,
          user: user ? { _id: user._id, clerkId: user.clerkId } : null,
          isLeader: m.userId === team.leaderId,
        }
      })
    )

    return {
      team,
      members: membersWithDetails,
    }
  },
})

// Remove participant from event
export const removeParticipant = mutation({
  args: { participantId: v.id("eventParticipants") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete(args.participantId)
    return args.participantId
  },
})
