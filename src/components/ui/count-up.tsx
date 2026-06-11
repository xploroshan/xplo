"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"

/**
 * Counts from 0 to `value` when scrolled into view.
 * Accepts strings like "10K+", "500+", "50" — the numeric prefix animates,
 * the suffix renders as-is. Falls back to a static value for reduced motion.
 */
export function CountUp({ value, duration = 1.4 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const reduceMotion = useReducedMotion()
  const match = value.match(/^(\d+)(.*)$/)
  const target = match ? parseInt(match[1], 10) : 0
  const suffix = match ? match[2] : value
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView || !match) return
    if (reduceMotion) {
      setDisplay(target)
      return
    }
    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      // ease-out cubic
      setDisplay(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion, target, duration])

  return (
    <span ref={ref}>
      {match ? display.toLocaleString("en-IN") : ""}
      {suffix}
    </span>
  )
}
