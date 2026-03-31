import { Users, Search, Shield, Ban, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function AdminUsersPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-zinc-400 mt-1">Manage all platform users, roles, and permissions.</p>
        </div>
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Users className="h-3 w-3 mr-1" /> 0 users
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Users", "Organizers", "Admins", "Banned"].map((filter) => (
            <Button
              key={filter}
              variant={filter === "All" ? "default" : "outline"}
              size="sm"
              className={
                filter === "All"
                  ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg"
                  : "border-zinc-700 text-zinc-400 hover:text-white rounded-lg"
              }
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-white text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/30">
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">User</th>
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">Role</th>
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">City</th>
                  <th className="text-left text-zinc-400 font-medium px-4 py-3">Status</th>
                  <th className="text-right text-zinc-400 font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-500">
                    No users registered yet. They will appear here once users sign up.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
