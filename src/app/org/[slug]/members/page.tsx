"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  Trash2,
  Shield,
  ChevronDown,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Role = "OWNER" | "ADMIN" | "EVENT_MANAGER" | "MEMBER"

interface Member {
  id: string
  userId: string
  name: string
  email: string
  image?: string | null
  role: Role
}

const roleConfig: Record<Role, { label: string; color: string; bg: string }> = {
  OWNER: { label: "Owner", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  ADMIN: { label: "Admin", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  EVENT_MANAGER: { label: "Event Manager", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
  MEMBER: { label: "Member", color: "text-zinc-400", bg: "bg-zinc-700/50 border-zinc-600/20" },
}

const roleOptions: Role[] = ["OWNER", "ADMIN", "EVENT_MANAGER", "MEMBER"]

export default function OrgMembersPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addRole, setAddRole] = useState<Role>("MEMBER")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${slug}/members`)
      if (res.status === 403 || res.status === 401) {
        router.push(`/org/${slug}`)
        return
      }
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      const membersList = Array.isArray(data) ? data : data.members ?? []
      setMembers(membersList)

      const currentUser = membersList.find(
        (m: Member) => m.userId === (session?.user as { id?: string })?.id
      )
      if (currentUser) setCurrentUserRole(currentUser.role)
    } catch {
      setError("Failed to load members")
    } finally {
      setLoading(false)
    }
  }, [slug, router, session])

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/org/${slug}`)
      return
    }
    if (authStatus === "authenticated") fetchMembers()
  }, [authStatus, router, slug, fetchMembers])

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAdding(true)
    setError(null)

    try {
      const res = await fetch(`/api/organizations/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, role: addRole }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to add member")
      }
      setAddEmail("")
      setAddRole("MEMBER")
      fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setAdding(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: Role) {
    try {
      const res = await fetch(`/api/organizations/${slug}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update role")
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const res = await fetch(`/api/organizations/${slug}/members/${memberId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to remove member")
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      setConfirmRemove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN"
  const currentUserId = (session?.user as { id?: string })?.id

  if (loading || authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Users className="h-6 w-6 text-orange-500" />
            Team Members
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your organization&apos;s team
          </p>
        </div>

        {/* Add Member */}
        {canManage && (
          <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5 text-orange-500" />
                Add Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="Email or name..."
                  className="flex-1 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
                <div className="relative">
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as Role)}
                    className="h-10 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 sm:w-44"
                  >
                    {roleOptions.filter((r) => r !== "OWNER").map((r) => (
                      <option key={r} value={r}>
                        {roleConfig[r].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                </div>
                <Button type="submit" variant="glow" disabled={adding || !addEmail.trim()}>
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const role = roleConfig[member.role]
            const isCurrentUser = member.userId === currentUserId
            const canRemove = canManage && !isCurrentUser && member.role !== "OWNER"
            const canChangeRole =
              canManage &&
              !isCurrentUser &&
              !(member.role === "OWNER" && currentUserRole !== "OWNER")

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-400">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {member.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-zinc-500">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{member.email}</p>
                </div>

                {canChangeRole ? (
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                      className="h-8 appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-2.5 pr-7 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {roleConfig[r].label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
                  </div>
                ) : (
                  <Badge className={`border text-[10px] ${role.bg} ${role.color}`}>
                    {member.role === "OWNER" && (
                      <Shield className="mr-1 h-3 w-3" />
                    )}
                    {role.label}
                  </Badge>
                )}

                {canRemove && (
                  <>
                    {confirmRemove === member.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700"
                          onClick={() => setConfirmRemove(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        onClick={() => setConfirmRemove(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </motion.div>
            )
          })}

          {filteredMembers.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-zinc-500">
                {searchQuery ? "No members match your search" : "No members found"}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
