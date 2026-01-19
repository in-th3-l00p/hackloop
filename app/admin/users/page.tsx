"use client"

import { useState, useEffect, useTransition } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Shield, ShieldOff, Ban, UserCheck, Loader2 } from "lucide-react"
import { getClerkUsers, banUser, unbanUser, type ClerkUserInfo } from "./actions"

interface CombinedUser {
  id: Id<"users">
  clerkId: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
  role: "admin" | "user"
  createdAt: number
  banned: boolean
}

export default function UsersPage() {
  const convexUsers = useQuery(api.users.getAllUsers)
  const updateRole = useMutation(api.users.updateUserRole)
  const [clerkUsers, setClerkUsers] = useState<ClerkUserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    type: "makeAdmin" | "removeAdmin" | "ban" | "unban" | null
    user: CombinedUser | null
  }>({ open: false, type: null, user: null })

  useEffect(() => {
    loadClerkUsers()
  }, [])

  async function loadClerkUsers() {
    setLoading(true)
    try {
      const data = await getClerkUsers()
      setClerkUsers(data)
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }

  // Combine Clerk user info with Convex role data
  const combinedUsers: CombinedUser[] = (convexUsers ?? []).map((convexUser) => {
    const clerkUser = clerkUsers.find((c) => c.clerkId === convexUser.clerkId)
    return {
      id: convexUser._id,
      clerkId: convexUser.clerkId,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      email: clerkUser?.email ?? "",
      imageUrl: clerkUser?.imageUrl ?? "",
      role: convexUser.role,
      createdAt: clerkUser?.createdAt ?? 0,
      banned: clerkUser?.banned ?? false,
    }
  })

  const filteredUsers = combinedUsers.filter((user) => {
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleAction = () => {
    if (!dialogState.user || !dialogState.type) return

    startTransition(async () => {
      const user = dialogState.user!

      switch (dialogState.type) {
        case "makeAdmin":
          await updateRole({ userId: user.id, role: "admin" })
          break
        case "removeAdmin":
          await updateRole({ userId: user.id, role: "user" })
          break
        case "ban":
          await banUser(user.clerkId)
          await loadClerkUsers()
          break
        case "unban":
          await unbanUser(user.clerkId)
          await loadClerkUsers()
          break
      }

      setDialogState({ open: false, type: null, user: null })
    })
  }

  const openDialog = (type: "makeAdmin" | "removeAdmin" | "ban" | "unban", user: CombinedUser) => {
    setDialogState({ open: true, type, user })
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown"
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getUserName = (user: CombinedUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    }
    return user.email.split("@")[0] || "Unknown"
  }

  const getInitials = (user: CombinedUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`
    }
    if (user.firstName) {
      return user.firstName[0]
    }
    return user.email[0]?.toUpperCase() ?? "?"
  }

  const isLoading = loading || convexUsers === undefined

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage platform users</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={user.imageUrl} alt={getUserName(user)} />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getUserName(user)}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.banned ? "destructive" : "outline"}>
                      {user.banned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.role === "user" ? (
                          <DropdownMenuItem onClick={() => openDialog("makeAdmin", user)}>
                            <Shield className="mr-2 size-4" />
                            Make Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => openDialog("removeAdmin", user)}>
                            <ShieldOff className="mr-2 size-4" />
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.banned ? (
                          <DropdownMenuItem onClick={() => openDialog("unban", user)}>
                            <UserCheck className="mr-2 size-4" />
                            Unban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDialog("ban", user)}
                          >
                            <Ban className="mr-2 size-4" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.type === "makeAdmin" && "Make user admin?"}
              {dialogState.type === "removeAdmin" && "Remove admin privileges?"}
              {dialogState.type === "ban" && "Ban user?"}
              {dialogState.type === "unban" && "Unban user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === "makeAdmin" &&
                `${getUserName(dialogState.user!)} will have full admin access to the platform.`}
              {dialogState.type === "removeAdmin" &&
                `${getUserName(dialogState.user!)} will no longer have admin privileges.`}
              {dialogState.type === "ban" &&
                `${getUserName(dialogState.user!)} will be banned from the platform. They will not be able to sign in.`}
              {dialogState.type === "unban" &&
                `${getUserName(dialogState.user!)} will be unbanned and able to access the platform again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isPending}
              className={dialogState.type === "ban" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {dialogState.type === "makeAdmin" && "Make Admin"}
              {dialogState.type === "removeAdmin" && "Remove Admin"}
              {dialogState.type === "ban" && "Ban User"}
              {dialogState.type === "unban" && "Unban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
