import { create } from "zustand"

interface UIState {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  activeCategory: string | null
  setActiveCategory: (category: string | null) => void
  selectedConversation: string | null
  setSelectedConversation: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),
  activeCategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),
  selectedConversation: null,
  setSelectedConversation: (id) => set({ selectedConversation: id }),
}))
