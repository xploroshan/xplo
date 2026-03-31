import { Calendar, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function AdminEventsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Management</h1>
          <p className="text-zinc-400 mt-1">Review, approve, feature, or remove events.</p>
        </div>
        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
          <Calendar className="h-3 w-3 mr-1" /> 0 events
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search events..."
            className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Draft", "Published", "Active", "Completed"].map((filter) => (
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

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-white text-base">All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-zinc-500">
            No events created yet. Events will appear here for moderation.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
