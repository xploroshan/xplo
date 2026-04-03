import { create } from "zustand"

interface EventFilters {
  city: string | null
  country: string
  dateFrom: string | null
  dateTo: string | null
  eventType: string | null
  destination: string | null
  searchQuery: string
  sortBy: "date" | "rating" | "popularity"
}

interface UIState {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  activeCategory: string | null
  setActiveCategory: (category: string | null) => void
  selectedConversation: string | null
  setSelectedConversation: (id: string | null) => void
  // Smart filters
  filters: EventFilters
  setCity: (city: string | null) => void
  setCountry: (country: string) => void
  setDateRange: (from: string | null, to: string | null) => void
  setEventType: (type: string | null) => void
  setDestination: (destination: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: "date" | "rating" | "popularity") => void
  resetFilters: () => void
}

const defaultFilters: EventFilters = {
  city: null,
  country: "India",
  dateFrom: null,
  dateTo: null,
  eventType: null,
  destination: null,
  searchQuery: "",
  sortBy: "date",
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),
  activeCategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),
  selectedConversation: null,
  setSelectedConversation: (id) => set({ selectedConversation: id }),
  // Smart filters
  filters: { ...defaultFilters },
  setCity: (city) => set((s) => ({ filters: { ...s.filters, city } })),
  setCountry: (country) => set((s) => ({ filters: { ...s.filters, country } })),
  setDateRange: (from, to) => set((s) => ({ filters: { ...s.filters, dateFrom: from, dateTo: to } })),
  setEventType: (type) => set((s) => ({ filters: { ...s.filters, eventType: type }, activeCategory: type })),
  setDestination: (destination) => set((s) => ({ filters: { ...s.filters, destination } })),
  setSearchQuery: (query) => set((s) => ({ filters: { ...s.filters, searchQuery: query } })),
  setSortBy: (sort) => set((s) => ({ filters: { ...s.filters, sortBy: sort } })),
  resetFilters: () => set({ filters: { ...defaultFilters }, activeCategory: null }),
}))
