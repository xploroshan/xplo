"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  Calendar,
  Navigation,
  ChevronDown,
  X,
  Search,
  Bike,
  Mountain,
  Plane,
  Tent,
  Car,
  Footprints,
  Waves,
  RotateCcw,
  Locate,
  Globe,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { searchCities, getNearbyCities, type WorldCity } from "@/lib/world-cities"
import { searchDestinations, getPopularDestinations, getNearbyDestinations, type WorldDestination } from "@/lib/world-destinations"
import { useGeolocation } from "@/hooks/use-geolocation"
import { DEFAULT_EVENT_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ElementType> = {
  Bike, Bicycle: Bike, Mountain, Plane, Tent, Car, Footprints, Waves,
}

interface SmartFilterBarProps {
  availableDestinations: string[]
  totalResults: number
}

export function SmartFilterBar({ availableDestinations, totalResults }: SmartFilterBarProps) {
  const {
    filters,
    setCity,
    setDateRange,
    setEventType,
    setDestination,
    setSearchQuery,
    setSortBy,
    resetFilters,
  } = useUIStore()

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState("")
  const [destSearch, setDestSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const { lat, lng, loading: geoLoading } = useGeolocation()

  // City search: show nearby cities when no search, search results when typing
  const displayCities = useMemo((): (WorldCity & { distance?: number })[] => {
    if (citySearch.trim()) {
      return searchCities(citySearch, 24)
    }
    if (lat !== null && lng !== null) {
      return getNearbyCities(lat, lng, 12)
    }
    // Fallback: popular global cities
    return searchCities("", 0) // empty — we'll show hardcoded popular below
  }, [citySearch, lat, lng])

  // Destination search: show popular/nearby when no search, search results when typing
  const displayDestinations = useMemo((): (WorldDestination & { distance?: number })[] => {
    if (destSearch.trim()) {
      return searchDestinations(destSearch, 24)
    }
    if (lat !== null && lng !== null) {
      return getNearbyDestinations(lat, lng, 16)
    }
    return getPopularDestinations(16)
  }, [destSearch, lat, lng])

  const hasActiveFilters = filters.city || filters.dateFrom || filters.eventType || filters.destination

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const activeType = DEFAULT_EVENT_TYPES.find((t) => t.slug === filters.eventType)

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Main Filter Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-800/60 bg-zinc-900/70 backdrop-blur-xl p-1.5 shadow-lg shadow-black/10"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
          {/* City Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setOpenDropdown(openDropdown === "city" ? null : "city")}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all",
                openDropdown === "city"
                  ? "bg-zinc-800 text-white"
                  : filters.city
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{filters.city || "Select City"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 ml-auto shrink-0 transition-transform", openDropdown === "city" && "rotate-180")} />
            </button>
          </div>

          <div className="hidden sm:block w-px h-8 bg-zinc-700/50" />

          {/* Date Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all",
                openDropdown === "date"
                  ? "bg-zinc-800 text-white"
                  : filters.dateFrom
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">
                {filters.dateFrom
                  ? `${new Date(filters.dateFrom).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}${filters.dateTo ? ` – ${new Date(filters.dateTo).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : ""}`
                  : "Any Date"
                }
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 ml-auto shrink-0 transition-transform", openDropdown === "date" && "rotate-180")} />
            </button>
          </div>

          <div className="hidden sm:block w-px h-8 bg-zinc-700/50" />

          {/* Event Type Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setOpenDropdown(openDropdown === "type" ? null : "type")}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all",
                openDropdown === "type"
                  ? "bg-zinc-800 text-white"
                  : filters.eventType
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              {activeType ? (
                <>
                  {iconMap[activeType.icon] && (() => { const Icon = iconMap[activeType.icon]; return <Icon className="h-4 w-4 shrink-0" style={{ color: activeType.color }} /> })()}
                  <span className="truncate font-medium" style={{ color: activeType.color }}>{activeType.name}</span>
                </>
              ) : (
                <>
                  <Mountain className="h-4 w-4 shrink-0" />
                  <span className="truncate font-medium">Event Type</span>
                </>
              )}
              <ChevronDown className={cn("h-3.5 w-3.5 ml-auto shrink-0 transition-transform", openDropdown === "type" && "rotate-180")} />
            </button>
          </div>

          <div className="hidden sm:block w-px h-8 bg-zinc-700/50" />

          {/* Destination Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setOpenDropdown(openDropdown === "destination" ? null : "destination")}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all",
                openDropdown === "destination"
                  ? "bg-zinc-800 text-white"
                  : filters.destination
                    ? "bg-orange-500/10 text-orange-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <Navigation className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{filters.destination || "Destination"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 ml-auto shrink-0 transition-transform", openDropdown === "destination" && "rotate-180")} />
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setOpenDropdown(null)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shrink-0"
          >
            <Search className="h-4 w-4" />
            <span className="sm:hidden lg:inline">Search</span>
          </button>
        </div>
      </motion.div>

      {/* Active Filters Tags + Sort */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.city && (
            <FilterTag label={filters.city} icon={<MapPin className="h-3 w-3" />} onRemove={() => setCity(null)} />
          )}
          {filters.dateFrom && (
            <FilterTag
              label={`${new Date(filters.dateFrom).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}${filters.dateTo ? ` – ${new Date(filters.dateTo).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : ""}`}
              icon={<Calendar className="h-3 w-3" />}
              onRemove={() => setDateRange(null, null)}
            />
          )}
          {filters.eventType && activeType && (
            <FilterTag label={activeType.name} color={activeType.color} onRemove={() => setEventType(null)} />
          )}
          {filters.destination && (
            <FilterTag label={filters.destination} icon={<Navigation className="h-3 w-3" />} onRemove={() => setDestination(null)} />
          )}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1"
            >
              <RotateCcw className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{totalResults} events</span>
          <div className="flex items-center rounded-lg border border-zinc-800 overflow-hidden">
            {(["date", "rating", "popularity"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors capitalize",
                  filters.sortBy === s ? "bg-orange-500/15 text-orange-400" : "text-zinc-500 hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dropdown Panels */}
      <AnimatePresence>
        {/* ── CITY DROPDOWN ── */}
        {openDropdown === "city" && (
          <DropdownPanel>
            <div className="p-3">
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 mb-3">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search any city worldwide..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
                  autoFocus
                />
                {citySearch && (
                  <button onClick={() => setCitySearch("")} className="text-zinc-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  {!citySearch && lat !== null && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                      <Locate className="h-3 w-3" />
                      Near You
                    </span>
                  )}
                  {!citySearch && lat === null && !geoLoading && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                      <Globe className="h-3 w-3" />
                      Popular Cities
                    </span>
                  )}
                  {citySearch && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Results for &ldquo;{citySearch}&rdquo;
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-72 overflow-y-auto scrollbar-none">
                {(citySearch ? displayCities : (displayCities.length > 0 ? displayCities : FALLBACK_POPULAR_CITIES)).map((city) => (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => { setCity(city.name); setOpenDropdown(null); setCitySearch("") }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                      filters.city === city.name
                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                        : "text-zinc-300 hover:bg-zinc-800 border border-transparent"
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{city.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {city.region}, {city.country}
                        {"distance" in city && typeof city.distance === "number" && (
                          <span className="ml-1 text-emerald-500">
                            {city.distance < 100 ? `${Math.round(city.distance)} km` : `${Math.round(city.distance)} km`}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {citySearch && displayCities.length === 0 && (
                  <div className="col-span-full text-center py-6 text-zinc-500 text-sm">
                    No cities found for &ldquo;{citySearch}&rdquo;
                  </div>
                )}
              </div>

              {!citySearch && (
                <p className="mt-2 text-[11px] text-zinc-600 px-1">
                  Type to search 250+ cities across all continents
                </p>
              )}
            </div>
          </DropdownPanel>
        )}

        {/* ── DATE DROPDOWN ── */}
        {openDropdown === "date" && (
          <DropdownPanel>
            <div className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">Quick Select</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {getDatePresets().map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setDateRange(preset.from, preset.to); setOpenDropdown(null) }}
                    className="px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all border border-zinc-800/50 hover:border-zinc-700 text-left"
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{preset.description}</div>
                  </button>
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Custom Range</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => setDateRange(e.target.value || null, filters.dateTo)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => setDateRange(filters.dateFrom, e.target.value || null)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </DropdownPanel>
        )}

        {/* ── EVENT TYPE DROPDOWN ── */}
        {openDropdown === "type" && (
          <DropdownPanel>
            <div className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => { setEventType(null); setOpenDropdown(null) }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm transition-all",
                    !filters.eventType
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                      : "text-zinc-300 hover:bg-zinc-800 border border-zinc-800/50 hover:border-zinc-700"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Search className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">All Types</div>
                  </div>
                </button>
                {DEFAULT_EVENT_TYPES.map((type) => {
                  const Icon = iconMap[type.icon]
                  const isActive = filters.eventType === type.slug
                  return (
                    <button
                      key={type.slug}
                      onClick={() => { setEventType(isActive ? null : type.slug); setOpenDropdown(null) }}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm transition-all",
                        isActive
                          ? "border border-opacity-30"
                          : "text-zinc-300 hover:bg-zinc-800 border border-zinc-800/50 hover:border-zinc-700"
                      )}
                      style={isActive ? {
                        backgroundColor: `${type.color}15`,
                        color: type.color,
                        borderColor: `${type.color}40`,
                      } : undefined}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${type.color}15` }}
                      >
                        {Icon && <Icon className="h-4 w-4" style={{ color: type.color }} />}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-xs">{type.name}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </DropdownPanel>
        )}

        {/* ── DESTINATION DROPDOWN ── */}
        {openDropdown === "destination" && (
          <DropdownPanel>
            <div className="p-3">
              <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 mb-3">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search destinations worldwide..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
                  autoFocus
                />
                {destSearch && (
                  <button onClick={() => setDestSearch("")} className="text-zinc-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2 px-1">
                {!destSearch && lat !== null && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                    <Locate className="h-3 w-3" />
                    Nearby Destinations
                  </span>
                )}
                {!destSearch && lat === null && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    <Globe className="h-3 w-3" />
                    Popular Destinations
                  </span>
                )}
                {destSearch && (
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Results for &ldquo;{destSearch}&rdquo;
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-72 overflow-y-auto scrollbar-none">
                {/* Any Destination option */}
                <button
                  onClick={() => { setDestination(null); setOpenDropdown(null); setDestSearch("") }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                    !filters.destination
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                      : "text-zinc-300 hover:bg-zinc-800 border border-transparent"
                  )}
                >
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <span className="font-medium">Any Destination</span>
                </button>

                {/* Event-specific destinations (from current events) */}
                {!destSearch && availableDestinations.length > 0 && availableDestinations.map((dest) => (
                  <button
                    key={`evt-${dest}`}
                    onClick={() => { setDestination(dest); setOpenDropdown(null); setDestSearch("") }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                      filters.destination === dest
                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                        : "text-zinc-300 hover:bg-zinc-800 border border-transparent"
                    )}
                  >
                    <Navigation className="h-3.5 w-3.5 shrink-0 text-orange-500/60" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{dest}</div>
                      <div className="text-[10px] text-orange-500/50">Active events</div>
                    </div>
                  </button>
                ))}

                {/* World destinations */}
                {displayDestinations.map((dest) => (
                  <button
                    key={`${dest.name}-${dest.country}`}
                    onClick={() => { setDestination(dest.name); setOpenDropdown(null); setDestSearch("") }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                      filters.destination === dest.name
                        ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                        : "text-zinc-300 hover:bg-zinc-800 border border-transparent"
                    )}
                  >
                    <Navigation className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{dest.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {dest.country}
                        {dest.tags.length > 0 && (
                          <span className="ml-1 text-zinc-600">
                            · {dest.tags.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {destSearch && displayDestinations.length === 0 && (
                  <div className="col-span-full text-center py-6 text-zinc-500 text-sm">
                    No destinations found for &ldquo;{destSearch}&rdquo;
                  </div>
                )}
              </div>

              {!destSearch && (
                <p className="mt-2 text-[11px] text-zinc-600 px-1">
                  Search 150+ tourist, trekking & hiking destinations worldwide
                </p>
              )}
            </div>
          </DropdownPanel>
        )}
      </AnimatePresence>

      {/* Search Input */}
      <div className="flex items-center gap-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 px-4 py-2.5">
        <Search className="h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search events, organizers, locations..."
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
        />
        {filters.searchQuery && (
          <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Fallback popular cities when geolocation is unavailable ────────────────
const FALLBACK_POPULAR_CITIES: WorldCity[] = [
  { name: "Bangalore", region: "Karnataka", country: "India", continent: "Asia", lat: 12.97, lng: 77.59 },
  { name: "Mumbai", region: "Maharashtra", country: "India", continent: "Asia", lat: 19.08, lng: 72.88 },
  { name: "Delhi", region: "Delhi", country: "India", continent: "Asia", lat: 28.70, lng: 77.10 },
  { name: "London", region: "England", country: "United Kingdom", continent: "Europe", lat: 51.51, lng: -0.13 },
  { name: "New York", region: "New York", country: "United States", continent: "North America", lat: 40.71, lng: -74.01 },
  { name: "Dubai", region: "Dubai", country: "UAE", continent: "Asia", lat: 25.20, lng: 55.27 },
  { name: "Singapore", region: "Singapore", country: "Singapore", continent: "Asia", lat: 1.35, lng: 103.82 },
  { name: "Tokyo", region: "Tokyo", country: "Japan", continent: "Asia", lat: 35.68, lng: 139.65 },
  { name: "Sydney", region: "New South Wales", country: "Australia", continent: "Oceania", lat: -33.87, lng: 151.21 },
  { name: "Bangkok", region: "Bangkok", country: "Thailand", continent: "Asia", lat: 13.76, lng: 100.50 },
  { name: "Paris", region: "Île-de-France", country: "France", continent: "Europe", lat: 48.86, lng: 2.35 },
  { name: "Cape Town", region: "Western Cape", country: "South Africa", continent: "Africa", lat: -33.92, lng: 18.42 },
]

// ─── Sub-components ─────────────────────────────────────────────────────────

function FilterTag({
  label,
  icon,
  color,
  onRemove,
}: {
  label: string
  icon?: React.ReactNode
  color?: string
  onRemove: () => void
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors"
      style={color ? {
        backgroundColor: `${color}15`,
        color,
        borderColor: `${color}30`,
      } : {
        backgroundColor: "rgba(249,115,22,0.1)",
        color: "rgb(251,146,60)",
        borderColor: "rgba(249,115,22,0.3)",
      }}
    >
      {icon}
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  )
}

function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
    >
      {children}
    </motion.div>
  )
}

function getDatePresets() {
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  const endOfWeek = new Date(now)
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const nextWeekend = new Date(now)
  const daysUntilSat = (6 - nextWeekend.getDay() + 7) % 7 || 7
  nextWeekend.setDate(nextWeekend.getDate() + daysUntilSat)
  const nextSunday = new Date(nextWeekend)
  nextSunday.setDate(nextSunday.getDate() + 1)

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  return [
    { label: "This Week", description: `Until ${endOfWeek.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`, from: today, to: endOfWeek.toISOString().split("T")[0] },
    { label: "This Weekend", description: `${nextWeekend.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`, from: nextWeekend.toISOString().split("T")[0], to: nextSunday.toISOString().split("T")[0] },
    { label: "This Month", description: `Until ${endOfMonth.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`, from: today, to: endOfMonth.toISOString().split("T")[0] },
    { label: "Next Month", description: `${nextMonth.toLocaleDateString("en-IN", { month: "short" })}`, from: nextMonth.toISOString().split("T")[0], to: endOfNextMonth.toISOString().split("T")[0] },
  ]
}
