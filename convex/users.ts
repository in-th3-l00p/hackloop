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
    const name = identity.name ?? identity.nickname ?? undefined
    const email = identity.email ?? undefined
    const imageUrl = identity.pictureUrl ?? undefined

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique()

    if (existingUser) {
      // Update user info if it changed
      const updates: Record<string, string | undefined> = {}
      if (name && name !== existingUser.name) updates.name = name
      if (email && email !== existingUser.email) updates.email = email
      if (imageUrl && imageUrl !== existingUser.imageUrl) updates.imageUrl = imageUrl

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingUser._id, updates)
      }

      return existingUser._id
    }

    const userCount = await ctx.db.query("users").collect()
    const isFirstUser = userCount.length === 0

    const userId = await ctx.db.insert("users", {
      clerkId,
      name,
      email,
      imageUrl,
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