// Mock data for development — populates all pages with realistic content

export interface MockOrganizer {
  id: string
  name: string
  slug: string
  image: string | null
  verified: boolean
  bio: string
  city: string
  eventCount: number
  followerCount: number
  rating: number
}

export interface MockEvent {
  id: string
  title: string
  slug: string
  description: string
  startDate: string
  endDate: string | null
  startLocation: { address: string }
  destination: { address: string }
  capacity: number
  registeredCount: number
  price: number
  currency: string
  coverImage: string | null
  status: string
  featured: boolean
  eventType: { name: string; slug: string; icon: string; color: string }
  organizer: MockOrganizer
  participants: { id: string; name: string; image: string | null }[]
}

export interface MockPost {
  id: string
  author: MockOrganizer
  content: string
  images: string[]
  hashtags: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
  eventTag?: { title: string; slug: string; type: string }
}

export interface MockActivity {
  id: string
  type: "join" | "complete" | "create" | "badge"
  description: string
  user: { name: string; image: string | null }
  event?: { title: string; slug: string; typeColor: string }
  createdAt: string
}

export interface MockConversation {
  id: string
  name: string
  image: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isGroup: boolean
  eventType?: { color: string }
}

export interface MockMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderImage: string | null
  isOwn: boolean
  createdAt: string
  type: "text" | "image" | "system"
}

export interface MockBadge {
  id: string
  name: string
  description: string
  icon: string
  rarity: "bronze" | "silver" | "gold" | "platinum"
  earned: boolean
  earnedAt?: string
}

// ─── Organizers ──────────────────────────────────────────────────────────────

export const MOCK_ORGANIZERS: MockOrganizer[] = [
  { id: "org-1", name: "RiderX Bangalore", slug: "riderx-bangalore", image: null, verified: true, bio: "Bangalore's premier motorcycle riding community", city: "Bangalore", eventCount: 42, followerCount: 1280, rating: 4.8 },
  { id: "org-2", name: "Trek Tribe India", slug: "trek-tribe-india", image: null, verified: true, bio: "Weekend treks and mountain adventures", city: "Bangalore", eventCount: 38, followerCount: 960, rating: 4.9 },
  { id: "org-3", name: "Pedal Power BLR", slug: "pedal-power-blr", image: null, verified: false, bio: "Cycling enthusiasts connecting riders across the city", city: "Bangalore", eventCount: 25, followerCount: 540, rating: 4.6 },
  { id: "org-4", name: "Wanderlust Wheels", slug: "wanderlust-wheels", image: null, verified: true, bio: "Road trips and long-distance rides across India", city: "Mumbai", eventCount: 31, followerCount: 820, rating: 4.7 },
  { id: "org-5", name: "AquaVenture Club", slug: "aquaventure-club", image: null, verified: false, bio: "Water sports and coastal adventures", city: "Goa", eventCount: 18, followerCount: 390, rating: 4.5 },
  { id: "org-6", name: "Trail Runners KA", slug: "trail-runners-ka", image: null, verified: true, bio: "Trail running and marathon training groups", city: "Bangalore", eventCount: 55, followerCount: 1100, rating: 4.8 },
]

// ─── Events ──────────────────────────────────────────────────────────────────

const now = new Date()
const day = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "evt-1", title: "Dawn Ride to Nandi Hills", slug: "dawn-ride-nandi-hills",
    description: "Join us for a breathtaking sunrise ride to Nandi Hills. We'll cruise through the early morning mist on NH44, stop for chai at the hilltop, and catch the sunrise above the clouds. All skill levels welcome — pace will be moderate.",
    startDate: day(2), endDate: day(2), startLocation: { address: "Hebbal Flyover, Bangalore" }, destination: { address: "Nandi Hills, Chikkaballapur" },
    capacity: 30, registeredCount: 22, price: 0, currency: "INR", coverImage: null, status: "OPEN", featured: true,
    eventType: { name: "Motorcycle Rides", slug: "motorcycle-rides", icon: "Bike", color: "#f97316" },
    organizer: MOCK_ORGANIZERS[0],
    participants: [{ id: "u1", name: "Arjun K", image: null }, { id: "u2", name: "Priya S", image: null }, { id: "u3", name: "Ravi M", image: null }],
  },
  {
    id: "evt-2", title: "Coorg Coffee Trail Trek", slug: "coorg-coffee-trail-trek",
    description: "A 2-day trek through Coorg's lush coffee plantations. We'll hike through misty trails, visit a working plantation, camp under the stars, and explore Dubare elephant camp.",
    startDate: day(5), endDate: day(6), startLocation: { address: "Madikeri Bus Stand" }, destination: { address: "Tadiandamol Peak, Coorg" },
    capacity: 20, registeredCount: 18, price: 2500, currency: "INR", coverImage: null, status: "OPEN", featured: true,
    eventType: { name: "Treks & Hikes", slug: "treks-hikes", icon: "Mountain", color: "#8b5cf6" },
    organizer: MOCK_ORGANIZERS[1],
    participants: [{ id: "u4", name: "Sneha R", image: null }, { id: "u5", name: "Karthik P", image: null }, { id: "u6", name: "Meera J", image: null }],
  },
  {
    id: "evt-3", title: "Cubbon Park Morning Ride", slug: "cubbon-park-morning-ride",
    description: "Easy-paced cycling through Cubbon Park and surrounding areas. Perfect for beginners — we'll cover 15km at a relaxed pace with a coffee stop midway.",
    startDate: day(1), endDate: null, startLocation: { address: "Cubbon Park Main Gate" }, destination: { address: "Cubbon Park Loop" },
    capacity: 25, registeredCount: 12, price: 0, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Bicycle Rides", slug: "bicycle-rides", icon: "Bicycle", color: "#22c55e" },
    organizer: MOCK_ORGANIZERS[2],
    participants: [{ id: "u7", name: "Anil D", image: null }, { id: "u8", name: "Divya K", image: null }],
  },
  {
    id: "evt-4", title: "Goa Coastal Highway Run", slug: "goa-coastal-highway-run",
    description: "A scenic ride along Goa's beautiful coastal highways. Start from Panjim, ride through beach roads, stop at Arambol for lunch, and return via the interior route.",
    startDate: day(8), endDate: day(9), startLocation: { address: "Panjim, Goa" }, destination: { address: "Arambol Beach, Goa" },
    capacity: 15, registeredCount: 15, price: 1500, currency: "INR", coverImage: null, status: "CLOSED", featured: true,
    eventType: { name: "Road Trips", slug: "road-trips", icon: "Car", color: "#f59e0b" },
    organizer: MOCK_ORGANIZERS[3],
    participants: [{ id: "u9", name: "Vikram S", image: null }, { id: "u10", name: "Nandini R", image: null }, { id: "u11", name: "Rahul T", image: null }],
  },
  {
    id: "evt-5", title: "Sakleshpur Monsoon Trek", slug: "sakleshpur-monsoon-trek",
    description: "Experience the Western Ghats in full monsoon glory. Green hills, waterfalls, and misty trails await. Moderate difficulty — good fitness required.",
    startDate: day(12), endDate: day(13), startLocation: { address: "Sakleshpur Town" }, destination: { address: "Bisle Ghat Viewpoint" },
    capacity: 18, registeredCount: 8, price: 1800, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Treks & Hikes", slug: "treks-hikes", icon: "Mountain", color: "#8b5cf6" },
    organizer: MOCK_ORGANIZERS[1],
    participants: [{ id: "u12", name: "Pooja M", image: null }],
  },
  {
    id: "evt-6", title: "Pondicherry Weekend Getaway", slug: "pondicherry-weekend-getaway",
    description: "Road trip from Bangalore to Pondicherry! French Quarter walks, beach time, and amazing food. Convoy of 8 cars — bring your road trip playlist.",
    startDate: day(15), endDate: day(16), startLocation: { address: "Electronic City, Bangalore" }, destination: { address: "White Town, Pondicherry" },
    capacity: 32, registeredCount: 20, price: 3500, currency: "INR", coverImage: null, status: "OPEN", featured: true,
    eventType: { name: "Group Travel", slug: "group-travel", icon: "Plane", color: "#3b82f6" },
    organizer: MOCK_ORGANIZERS[3],
    participants: [{ id: "u13", name: "Ananya B", image: null }, { id: "u14", name: "Siddharth K", image: null }, { id: "u15", name: "Lakshmi N", image: null }],
  },
  {
    id: "evt-7", title: "Kabini Riverside Camping", slug: "kabini-riverside-camping",
    description: "Camp by the Kabini river. Bonfire, stargazing, coracle rides, and wildlife sighting. Tents and meals included.",
    startDate: day(4), endDate: day(5), startLocation: { address: "Mysore Road Toll" }, destination: { address: "Kabini Backwaters" },
    capacity: 24, registeredCount: 19, price: 2200, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Camping", slug: "camping", icon: "Tent", color: "#10b981" },
    organizer: MOCK_ORGANIZERS[1],
    participants: [{ id: "u16", name: "Deepak V", image: null }, { id: "u17", name: "Shreya G", image: null }],
  },
  {
    id: "evt-8", title: "Sunday 10K Fun Run", slug: "sunday-10k-fun-run",
    description: "Weekly community 10K run through Bangalore's lake trails. All paces welcome — walkers, joggers, and runners. Free refreshments at the finish.",
    startDate: day(3), endDate: null, startLocation: { address: "Ulsoor Lake" }, destination: { address: "Cubbon Park" },
    capacity: 50, registeredCount: 35, price: 0, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Running Events", slug: "running-events", icon: "Footprints", color: "#ef4444" },
    organizer: MOCK_ORGANIZERS[5],
    participants: [{ id: "u18", name: "Kavitha R", image: null }, { id: "u19", name: "Mohan L", image: null }, { id: "u20", name: "Aisha N", image: null }],
  },
  {
    id: "evt-9", title: "Gokarna Beach Kayaking", slug: "gokarna-beach-kayaking",
    description: "Kayaking along Gokarna's pristine beaches. Paddle from Kudle Beach to Half Moon Beach with expert guides. No prior experience needed.",
    startDate: day(10), endDate: null, startLocation: { address: "Kudle Beach, Gokarna" }, destination: { address: "Half Moon Beach, Gokarna" },
    capacity: 12, registeredCount: 7, price: 1200, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Water Sports", slug: "water-sports", icon: "Waves", color: "#06b6d4" },
    organizer: MOCK_ORGANIZERS[4],
    participants: [{ id: "u21", name: "Rohan K", image: null }],
  },
  {
    id: "evt-10", title: "Midnight Highway Ride", slug: "midnight-highway-ride",
    description: "Late-night highway blast to Lepakshi and back. 240km round trip under the stars. Helmet and full gear mandatory.",
    startDate: day(6), endDate: day(7), startLocation: { address: "Kempegowda Airport Road" }, destination: { address: "Lepakshi Temple, Anantapur" },
    capacity: 20, registeredCount: 16, price: 0, currency: "INR", coverImage: null, status: "OPEN", featured: true,
    eventType: { name: "Motorcycle Rides", slug: "motorcycle-rides", icon: "Bike", color: "#f97316" },
    organizer: MOCK_ORGANIZERS[0],
    participants: [{ id: "u22", name: "Tarun V", image: null }, { id: "u23", name: "Nikhil B", image: null }],
  },
  {
    id: "evt-11", title: "Bannerghatta Century Ride", slug: "bannerghatta-century-ride",
    description: "100km cycling challenge through Bannerghatta National Park area. Intermediate-level ride with rolling hills. Support vehicle provided.",
    startDate: day(9), endDate: null, startLocation: { address: "Jayanagar 4th Block" }, destination: { address: "Bannerghatta Loop" },
    capacity: 20, registeredCount: 14, price: 500, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Bicycle Rides", slug: "bicycle-rides", icon: "Bicycle", color: "#22c55e" },
    organizer: MOCK_ORGANIZERS[2],
    participants: [{ id: "u24", name: "Suresh P", image: null }, { id: "u25", name: "Geeta M", image: null }],
  },
  {
    id: "evt-12", title: "Chikmagalur Trail Marathon", slug: "chikmagalur-trail-marathon",
    description: "21km trail run through Chikmagalur's coffee estates and hill trails. A challenging but rewarding course with stunning views.",
    startDate: day(20), endDate: null, startLocation: { address: "Chikmagalur Town" }, destination: { address: "Mullayanagiri Base" },
    capacity: 40, registeredCount: 28, price: 1000, currency: "INR", coverImage: null, status: "OPEN", featured: false,
    eventType: { name: "Running Events", slug: "running-events", icon: "Footprints", color: "#ef4444" },
    organizer: MOCK_ORGANIZERS[5],
    participants: [{ id: "u26", name: "Ashwin D", image: null }, { id: "u27", name: "Pallavi S", image: null }],
  },
]

// ─── Feed Posts ───────────────────────────────────────────────────────────────

export const MOCK_POSTS: MockPost[] = [
  {
    id: "post-1", author: MOCK_ORGANIZERS[0],
    content: "What an incredible dawn ride to Nandi Hills! 28 riders, perfect weather, and that sunrise was absolutely worth the 4 AM alarm. See you all next weekend! #DawnRide #NandiHills #BikerLife",
    images: [], hashtags: ["DawnRide", "NandiHills", "BikerLife"], likesCount: 142, commentsCount: 23,
    createdAt: day(-1), eventTag: { title: "Dawn Ride to Nandi Hills", slug: "dawn-ride-nandi-hills", type: "Motorcycle Rides" },
  },
  {
    id: "post-2", author: MOCK_ORGANIZERS[1],
    content: "The mist at Tadiandamol was unreal today. Our trekkers conquered the highest peak in Coorg! Nothing beats the feeling of reaching the summit together. #CoorgTrek #Trekking #WeekendVibes",
    images: [], hashtags: ["CoorgTrek", "Trekking", "WeekendVibes"], likesCount: 98, commentsCount: 15,
    createdAt: day(-2),
  },
  {
    id: "post-3", author: MOCK_ORGANIZERS[2],
    content: "Cubbon Park at 6 AM is a different world. 15 cyclists, zero traffic, pure bliss. If you're in Bangalore and haven't tried our morning rides, you're missing out! #CyclingLife #BangaloreCycling",
    images: [], hashtags: ["CyclingLife", "BangaloreCycling"], likesCount: 76, commentsCount: 11,
    createdAt: day(-3),
  },
  {
    id: "post-4", author: MOCK_ORGANIZERS[3],
    content: "Pondicherry road trip registrations are LIVE! 🚗 Limited to 8 cars this time. French Quarter, beach sunrise, and the best seafood. Link in bio. #Pondicherry #RoadTrip #WeekendGetaway",
    images: [], hashtags: ["Pondicherry", "RoadTrip", "WeekendGetaway"], likesCount: 210, commentsCount: 45,
    createdAt: day(-1), eventTag: { title: "Pondicherry Weekend Getaway", slug: "pondicherry-weekend-getaway", type: "Group Travel" },
  },
  {
    id: "post-5", author: MOCK_ORGANIZERS[5],
    content: "PB smashed! Our Sunday 10K group had 8 personal bests today. There's something about running with a crew that pushes you to go faster. Proud of everyone! #Running #10K #PersonalBest",
    images: [], hashtags: ["Running", "10K", "PersonalBest"], likesCount: 134, commentsCount: 19,
    createdAt: day(-4),
  },
]

// ─── Activity Feed ───────────────────────────────────────────────────────────

export const MOCK_ACTIVITIES: MockActivity[] = [
  { id: "act-1", type: "join", description: "Priya and 4 others joined", user: { name: "Priya S", image: null }, event: { title: "Dawn Ride to Nandi Hills", slug: "dawn-ride-nandi-hills", typeColor: "#f97316" }, createdAt: day(0) },
  { id: "act-2", type: "complete", description: "Completed with 23 riders!", user: { name: "RiderX Bangalore", image: null }, event: { title: "Lepakshi Night Run", slug: "midnight-highway-ride", typeColor: "#f97316" }, createdAt: day(-1) },
  { id: "act-3", type: "create", description: "Just created a new event", user: { name: "Trek Tribe India", image: null }, event: { title: "Sakleshpur Monsoon Trek", slug: "sakleshpur-monsoon-trek", typeColor: "#8b5cf6" }, createdAt: day(-1) },
  { id: "act-4", type: "join", description: "Karthik and 2 others joined", user: { name: "Karthik P", image: null }, event: { title: "Coorg Coffee Trail Trek", slug: "coorg-coffee-trail-trek", typeColor: "#8b5cf6" }, createdAt: day(-2) },
  { id: "act-5", type: "badge", description: "Earned the 'Century Rider' badge", user: { name: "Arjun K", image: null }, createdAt: day(-3) },
  { id: "act-6", type: "join", description: "Sneha and 6 others joined", user: { name: "Sneha R", image: null }, event: { title: "Sunday 10K Fun Run", slug: "sunday-10k-fun-run", typeColor: "#ef4444" }, createdAt: day(-3) },
]

// ─── Conversations ───────────────────────────────────────────────────────────

export const MOCK_CONVERSATIONS: MockConversation[] = [
  { id: "conv-1", name: "Dawn Ride to Nandi Hills", image: null, lastMessage: "Everyone please be at Hebbal by 4:30 AM sharp!", lastMessageTime: "2h ago", unreadCount: 3, isGroup: true, eventType: { color: "#f97316" } },
  { id: "conv-2", name: "Coorg Coffee Trail Trek", image: null, lastMessage: "Packing list updated — don't forget rain gear!", lastMessageTime: "5h ago", unreadCount: 0, isGroup: true, eventType: { color: "#8b5cf6" } },
  { id: "conv-3", name: "Arjun K", image: null, lastMessage: "Hey, are you coming for the night ride?", lastMessageTime: "1d ago", unreadCount: 1, isGroup: false },
  { id: "conv-4", name: "Kabini Riverside Camping", image: null, lastMessage: "Tent assignments are out! Check the doc.", lastMessageTime: "2d ago", unreadCount: 0, isGroup: true, eventType: { color: "#10b981" } },
  { id: "conv-5", name: "Priya S", image: null, lastMessage: "Thanks for the ride tips! Really helped.", lastMessageTime: "3d ago", unreadCount: 0, isGroup: false },
  { id: "conv-6", name: "Sunday 10K Fun Run", image: null, lastMessage: "Route map for tomorrow pinned above.", lastMessageTime: "4h ago", unreadCount: 5, isGroup: true, eventType: { color: "#ef4444" } },
]

export const MOCK_MESSAGES: MockMessage[] = [
  { id: "msg-1", content: "Hey everyone! Excited for the dawn ride this Saturday!", senderId: "org-1", senderName: "RiderX Bangalore", senderImage: null, isOwn: false, createdAt: day(-1), type: "text" },
  { id: "msg-2", content: "Can't wait! Do we need to carry breakfast or will there be stops?", senderId: "u1", senderName: "Arjun K", senderImage: null, isOwn: false, createdAt: day(-1), type: "text" },
  { id: "msg-3", content: "We'll stop at the hilltop dhabha for chai and breakfast. Just carry water for the ride up.", senderId: "org-1", senderName: "RiderX Bangalore", senderImage: null, isOwn: false, createdAt: day(-1), type: "text" },
  { id: "msg-4", content: "Perfect, thanks! I'll be there at 4:30.", senderId: "me", senderName: "You", senderImage: null, isOwn: true, createdAt: day(0), type: "text" },
  { id: "msg-5", content: "Everyone please be at Hebbal by 4:30 AM sharp! We leave at 4:45, no exceptions.", senderId: "org-1", senderName: "RiderX Bangalore", senderImage: null, isOwn: false, createdAt: day(0), type: "text" },
  { id: "msg-6", content: "Arjun K joined the event", senderId: "system", senderName: "System", senderImage: null, isOwn: false, createdAt: day(-2), type: "system" },
]

// ─── Badges ──────────────────────────────────────────────────────────────────

export const MOCK_BADGES: MockBadge[] = [
  { id: "badge-1", name: "First Ride", description: "Joined your first event", icon: "Flag", rarity: "bronze", earned: true, earnedAt: day(-30) },
  { id: "badge-2", name: "Explorer", description: "Joined 5 different event types", icon: "Compass", rarity: "silver", earned: true, earnedAt: day(-15) },
  { id: "badge-3", name: "Social Butterfly", description: "Follow 10 organizers", icon: "Heart", rarity: "silver", earned: false },
  { id: "badge-4", name: "Century Rider", description: "Completed 100km total distance", icon: "Zap", rarity: "gold", earned: true, earnedAt: day(-7) },
  { id: "badge-5", name: "Early Bird", description: "Registered within 1 hour of event creation", icon: "Clock", rarity: "bronze", earned: true, earnedAt: day(-20) },
  { id: "badge-6", name: "Rain Rider", description: "Completed an event during monsoon", icon: "CloudRain", rarity: "gold", earned: false },
  { id: "badge-7", name: "Veteran", description: "Completed 25 events", icon: "Award", rarity: "platinum", earned: false },
  { id: "badge-8", name: "Trailblazer", description: "Be the first to join an event", icon: "Flame", rarity: "silver", earned: true, earnedAt: day(-10) },
]
