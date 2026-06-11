"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ticket, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TicketType {
  id: string
  name: string
  description: string | null
  price: number
  soldOut: boolean
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (r: RazorpayResponse) => void
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function TicketPurchase({
  eventId,
  ticketTypes,
  isAuthenticated,
  buyer,
}: {
  eventId: string
  ticketTypes: TicketType[]
  isAuthenticated: boolean
  buyer: { name?: string | null; email?: string | null }
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function buy(tt: TicketType) {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/events`)
      return
    }
    setBusyId(tt.id)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId: tt.id, quantity: 1 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not start checkout")

      // Free tier — already confirmed.
      if (data.free) {
        setDone(true)
        router.refresh()
        return
      }

      const loaded = await loadScript()
      if (!loaded || !window.Razorpay) throw new Error("Couldn't load the payment window")

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HYKRZ",
        description: `${data.ticketName} · ${data.eventTitle}`,
        order_id: data.razorpayOrderId,
        prefill: { name: buyer.name ?? undefined, email: buyer.email ?? undefined },
        theme: { color: "#f97316" },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch(`/api/orders/${data.orderId}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            }),
          })
          if (v.ok) {
            setDone(true)
            router.refresh()
          } else {
            setError("Payment couldn't be confirmed. If you were charged, contact the organizer.")
          }
        },
        modal: { ondismiss: () => setBusyId(null) },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusyId(null)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-2 text-sm text-green-300">
        <CheckCircle2 className="h-5 w-5" />
        You&apos;re in! Your ticket is confirmed.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {ticketTypes.map((tt) => (
        <div key={tt.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <Ticket className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{tt.name}</p>
            {tt.description && <p className="text-xs text-zinc-500 truncate">{tt.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-white mb-1">
              {tt.price > 0 ? `₹${tt.price.toLocaleString("en-IN")}` : "Free"}
            </p>
            <Button
              size="sm"
              variant="glow"
              className="h-7 text-xs"
              disabled={tt.soldOut || busyId !== null}
              onClick={() => buy(tt)}
            >
              {busyId === tt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tt.soldOut ? "Sold out" : tt.price > 0 ? "Buy" : "Get"}
            </Button>
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
