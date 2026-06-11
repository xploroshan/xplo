// Re-mounts on every navigation, replaying the page-in animation.
// Pure CSS — no client JS, and disabled automatically for reduced motion.
export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>
}
