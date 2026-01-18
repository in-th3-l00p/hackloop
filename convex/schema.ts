import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  }).index("by_clerk_id", ["clerkId"]),

  events: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxTeamSize: v.number(),
    minTeamSize: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("active"),
      v.literal("judging"),
      v.literal("completed")
    ),
    theme: v.optional(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        documentId: v.optional(v.id("_storage")),
      })
    ),
    createdBy: v.id("users"),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"]),

  eventStaff: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    role: v.union(
      v.literal("organizer"),
      v.literal("judge"),
      v.literal("mentor")
    ),
    isJudge: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  eventParticipants: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    teamId: v.optional(v.id("teams")),
    joinedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  teams: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    leaderId: v.id("users"),
    inviteCode: v.string(),
  })
    .index("by_event", ["eventId"])
    .index("by_leader", ["leaderId"])
    .index("by_invite_code", ["inviteCode"]),

  submissions: defineTable({
    eventId: v.id("events"),
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    demoUrl: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    files: v.optional(v.array(v.id("_storage"))),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("disqualified")
    ),
    submittedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_team", ["teamId"])
    .index("by_event_and_team", ["eventId", "teamId"])
    .index("by_status", ["status"]),

  judgingCriteria: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    maxScore: v.number(),
    order: v.number(),
  }).index("by_event", ["eventId"]),

  scores: defineTable({
    submissionId: v.id("submissions"),
    judgeId: v.id("users"),
    criteriaId: v.id("judgingCriteria"),
    score: v.number(),
    feedback: v.optional(v.string()),
  })
    .index("by_submission", ["submissionId"])
    .index("by_judge", ["judgeId"])
    .index("by_submission_and_judge", ["submissionId", "judgeId"])
    .index("by_submission_and_criteria", ["submissionId", "criteriaId"]),

  announcements: defineTable({
    eventId: v.id("events"),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_and_created", ["eventId", "createdAt"]),

  chatMessages: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_and_created", ["eventId", "createdAt"]),
})
