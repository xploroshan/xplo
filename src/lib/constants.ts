export const APP_NAME = "RideConnect"
export const APP_DESCRIPTION =
  "Discover, organize, and join group events — motorcycle rides, treks, bicycle rides, group travel, and more. Connect with fellow adventurers in your city."
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const DEFAULT_EVENT_TYPES = [
  { name: "Motorcycle Rides", slug: "motorcycle-rides", icon: "Bike", color: "#f97316", description: "Cruiser, Sport, Adventure, Touring rides" },
  { name: "Bicycle Rides", slug: "bicycle-rides", icon: "Bicycle", color: "#22c55e", description: "Road cycling, mountain biking, city rides" },
  { name: "Treks & Hikes", slug: "treks-hikes", icon: "Mountain", color: "#8b5cf6", description: "Mountain treks, nature hikes, trail walks" },
  { name: "Group Travel", slug: "group-travel", icon: "Plane", color: "#3b82f6", description: "Road trips, weekend getaways, group tours" },
  { name: "Camping", slug: "camping", icon: "Tent", color: "#10b981", description: "Outdoor camping, glamping, bonfire nights" },
  { name: "Road Trips", slug: "road-trips", icon: "Car", color: "#f59e0b", description: "Long drives, scenic routes, highway adventures" },
  { name: "Running Events", slug: "running-events", icon: "Footprints", color: "#ef4444", description: "Marathons, fun runs, trail running" },
  { name: "Water Sports", slug: "water-sports", icon: "Waves", color: "#06b6d4", description: "Surfing, kayaking, rafting, sailing" },
] as const

export const NAV_ITEMS = [
  { label: "Events", href: "/events", icon: "Calendar" },
  { label: "Feed", href: "/feed", icon: "LayoutGrid" },
  { label: "Messages", href: "/messages", icon: "MessageCircle" },
  { label: "Profile", href: "/profile", icon: "User" },
] as const

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Events", href: "/admin/events", icon: "Calendar" },
  { label: "Event Types", href: "/admin/event-types", icon: "Tags" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const
