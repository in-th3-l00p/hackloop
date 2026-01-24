import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

// Generate a random team invite code
function generateTeamInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

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

// Create a new team
export const createTeam = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Check if user is a participant
    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation) {
      throw new Error("You are not a participant in this event")
    }

    // Check if user is already in a team
    if (participation.teamId) {
      throw new Error("You are already in a team")
    }

    // Check event status
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status === "completed" || event.status === "judging") {
      throw new Error("Cannot create teams after the event has ended")
    }

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      eventId: args.eventId,
      name: args.name,
      leaderId: user._id,
      inviteCode: generateTeamInviteCode(),
    })

    // Update participation with team
    await ctx.db.patch(participation._id, { teamId })

    return teamId
  },
})

// Join a team via invite code
export const joinTeamViaCode = mutation({
  args: {
    eventId: v.id("events"),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Check if user is a participant
    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation) {
      throw new Error("You are not a participant in this event")
    }

    // Check if user is already in a team
    if (participation.teamId) {
      throw new Error("You are already in a team")
    }

    // Find team by invite code
    const team = await ctx.db
      .query("teams")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique()

    if (!team) {
      throw new Error("Invalid team invite code")
    }

    if (team.eventId !== args.eventId) {
      throw new Error("This team is not part of this event")
    }

    // Check team size limit
    const event = await ctx.db.get(args.eventId)
    if (!event) {
      throw new Error("Event not found")
    }

    const teamMembers = await ctx.db
      .query("eventParticipants")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect()

    if (teamMembers.length >= event.maxTeamSize) {
      throw new Error("This team is full")
    }

    // Update participation with team
    await ctx.db.patch(participation._id, { teamId: team._id })

    return team._id
  },
})

// Leave a team
export const leaveTeam = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Check if user is a participant
    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique()

    if (!participation) {
      throw new Error("You are not a participant in this event")
    }

    if (!participation.teamId) {
      throw new Error("You are not in a team")
    }

    // Get team info
    const team = await ctx.db.get(participation.teamId)
    if (!team) {
      throw new Error("Team not found")
    }

    // Check if user is the leader
    if (team.leaderId === user._id) {
      // Get remaining team members
      const teamMembers = await ctx.db
        .query("eventParticipants")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect()

      if (teamMembers.length > 1) {
        // Transfer leadership to another member
        const newLeader = teamMembers.find((m) => m.userId !== user._id)
        if (newLeader) {
          await ctx.db.patch(team._id, { leaderId: newLeader.userId })
        }
      } else {
        // Delete the team if no other members
        // First check for submissions
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect()

        for (const submission of submissions) {
          await ctx.db.delete(submission._id)
        }

        await ctx.db.delete(team._id)
      }
    }

    // Remove from team
    await ctx.db.patch(participation._id, { teamId: undefined })

    return true
  },
})

// Get my team details
export const getMyTeam = query({
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

    const team = await ctx.db.get(participation.teamId)
    if (!team) return null

    // Get all team members
    const members = await ctx.db
      .query("eventParticipants")
      .withIndex("by_team", (q) => q.eq("teamId", team._id))
      .collect()

    const membersWithDetails = await Promise.all(
      members.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId)
        return {
          ...m,
          user: memberUser ? { _id: memberUser._id, clerkId: memberUser.clerkId } : null,
          isLeader: m.userId === team.leaderId,
        }
      })
    )

    return {
      ...team,
      members: membersWithDetails,
      isLeader: team.leaderId === user._id,
    }
  },
})

// Regenerate team invite code (leader only)
export const regenerateTeamInviteCode = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const team = await ctx.db.get(args.teamId)
    if (!team) {
      throw new Error("Team not found")
    }

    if (team.leaderId !== user._id) {
      throw new Error("Only the team leader can regenerate the invite code")
    }

    const newCode = generateTeamInviteCode()
    await ctx.db.patch(args.teamId, { inviteCode: newCode })

    return newCode
  },
})
