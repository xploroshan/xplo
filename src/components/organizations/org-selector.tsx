"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, User, Check } from "lucide-react"

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
}

interface OrgSelectorProps {
  value: string | null
  onChange: (orgId: string | null) => void
  organizations: Organization[]
}

export function OrgSelector({ value, onChange, organizations }: OrgSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = organizations.find((o) => o.id === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">
        Create as
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm transition-colors hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
      >
        <div className="flex items-center gap-2.5">
          {selected ? (
            <>
              {selected.logo ? (
                <Image
                  src={selected.logo}
                  alt={selected.name}
                  width={24}
                  height={24}
                  className="rounded-md"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-700 text-[10px] font-bold text-zinc-300">
                  {selected.name.charAt(0)}
                </div>
              )}
              <span className="text-white">{selected.name}</span>
            </>
          ) : (
            <>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700">
                <User className="h-3.5 w-3.5 text-zinc-400" />
              </div>
              <span className="text-white">Personal</span>
            </>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl"
          >
            {/* Personal option */}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-zinc-700/50 ${
                value === null ? "bg-orange-500/10 text-orange-400" : "text-white"
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700">
                <User className="h-3.5 w-3.5 text-zinc-400" />
              </div>
              <span className="flex-1 text-left">Personal</span>
              {value === null && <Check className="h-4 w-4 text-orange-500" />}
            </button>

            {organizations.length > 0 && (
              <div className="border-t border-zinc-700/50">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      onChange(org.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-zinc-700/50 ${
                      value === org.id
                        ? "bg-orange-500/10 text-orange-400"
                        : "text-white"
                    }`}
                  >
                    {org.logo ? (
                      <Image
                        src={org.logo}
                        alt={org.name}
                        width={24}
                        height={24}
                        className="rounded-md"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-700 text-[10px] font-bold text-zinc-300">
                        {org.name.charAt(0)}
                      </div>
                    )}
                    <span className="flex-1 text-left">{org.name}</span>
                    {value === org.id && (
                      <Check className="h-4 w-4 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
