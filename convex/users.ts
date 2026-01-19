import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { UserIdentity } from "convex/server"

type IdentityWithRole = UserIdentity & { role?: string }

function getRoleFromIdentity(identity: IdentityWithRole): "admin" | "user" {
  return identity.role === "admin" ? "admin" : "user"
}

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity() as IdentityWithRole | null
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const clerkId = identity.subject
    const role = getRoleFromIdentity(identity)
    console.log(identity);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique()

    if (existingUser) {
      if (existingUser.role !== role) {
        await ctx.db.patch(existingUser._id, { role })
      }
      return existingUser._id
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      role,
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
