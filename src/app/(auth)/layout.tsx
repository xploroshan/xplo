export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-amber-500/8 rounded-full blur-[128px]" />
      <div className="relative z-10 w-full max-w-md mx-auto px-4">{children}</div>
    </div>
  )
}
