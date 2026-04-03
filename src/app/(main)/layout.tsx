import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopBar } from "@/components/layout/app-top-bar"
import { AiAssistant } from "@/components/ai/ai-assistant"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopBar />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <AiAssistant />
    </div>
  )
}
