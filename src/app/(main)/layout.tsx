import { AppSidebar } from "@/components/layout/app-sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
    </div>
  )
}
