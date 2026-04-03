import { create } from "zustand"

interface AiMessage {
  role: "user" | "assistant"
  content: string
}

interface AiState {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleOpen: () => void
  messages: AiMessage[]
  addMessage: (message: AiMessage) => void
  clearMessages: () => void
  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void
  currentContext: {
    page: string
    eventSlug?: string
  }
  setCurrentContext: (ctx: { page: string; eventSlug?: string }) => void
}

export const useAiStore = create<AiState>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  messages: [],
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  currentContext: { page: "/" },
  setCurrentContext: (ctx) => set({ currentContext: ctx }),
}))
