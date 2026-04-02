import { Settings, MapPin, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { OrganizerCta } from "@/components/profile/organizer-cta"
import { ChangePassword } from "@/components/profile/change-password"

export const metadata = { title: "Profile" }

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <Avatar className="h-24 w-24 border-2 border-orange-500/30">
          <AvatarFallback className="bg-orange-500/10 text-orange-500 text-2xl font-bold">
            HK
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">HYKRZ User</h1>
          <p className="text-zinc-400 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" /> Bangalore, India
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Adventure enthusiast and weekend rider. Love exploring new routes and meeting fellow riders.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl border-zinc-700 text-zinc-300">
          <Settings className="h-4 w-4 mr-2" /> Edit Profile
        </Button>
      </div>

      {/* Organizer CTA */}
      <div className="mb-8">
        <OrganizerCta />
      </div>

      {/* Change Password */}
      <div className="mb-8">
        <ChangePassword />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Calendar, label: "Events Joined", value: "0" },
          { icon: Users, label: "Following", value: "0" },
          { icon: Users, label: "Followers", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center"
          >
            <stat.icon className="h-5 w-5 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity placeholder */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-zinc-500">Your adventure timeline will appear here.</p>
      </div>
    </div>
  )
}
