"use client"

import { Camera, Video, MessageCircle, Globe } from "lucide-react"

interface SocialLinksProps {
  links: Record<string, string>
}

const socialConfig: {
  key: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}[] = [
  { key: "instagram", icon: Camera, label: "Instagram" },
  { key: "youtube", icon: Video, label: "YouTube" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { key: "website", icon: Globe, label: "Website" },
]

export function SocialLinks({ links }: SocialLinksProps) {
  const activeLinks = socialConfig.filter(
    (s) => links[s.key] && links[s.key].trim() !== ""
  )

  if (activeLinks.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {activeLinks.map((social) => (
        <a
          key={social.key}
          href={links[social.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          title={social.label}
        >
          <social.icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}
