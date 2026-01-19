import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const clerkId = identity.subject

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique()

    if (existingUser) {
      return existingUser._id
    }

    const userCount = await ctx.db.query("users").collect()
    const isFirstUser = userCount.length === 0

    const userId = await ctx.db.insert("users", {
      clerkId,
      role: isFirstUser ? "admin" : "user",
    })

    return userId
  },
})

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    return user
  },
})

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    return user
  },
})

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const users = await ctx.db.query("users").collect()
    return users
  },
})

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return false
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    return user?.role === "admin"
  },
})

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    if (args.userId === currentUser._id && args.role !== "admin") {
      throw new Error("Cannot remove your own admin role")
    }

    await ctx.db.patch(args.userId, { role: args.role })
    return args.userId
  },
})