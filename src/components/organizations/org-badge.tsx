"use client"

import Link from "next/link"
import Image from "next/image"
import { BadgeCheck } from "lucide-react"

interface OrgBadgeProps {
  name: string
  slug: string
  logo?: string | null
  verified?: boolean
}

export function OrgBadge({ name, slug, logo, verified }: OrgBadgeProps) {
  return (
    <Link
      href={`/org/${slug}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
    >
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={16}
          height={16}
          className="rounded-sm"
        />
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-zinc-700 text-[8px] font-bold text-zinc-300">
          {name.charAt(0)}
        </div>
      )}
      <span className="text-xs font-medium text-zinc-200">{name}</span>
      {verified && <BadgeCheck className="h-3 w-3 text-blue-500" />}
    </Link>
  )
}
