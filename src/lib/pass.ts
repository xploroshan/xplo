/**
 * Event passes — a deterministic, HMAC-signed check-in code per participant.
 * No schema storage needed: the code is derived from the participant id and
 * verified by recomputing, so it can't be forged without AUTH_SECRET.
 *
 * QR payload format: HYKRZ|<eventId>|<participantId>|<code>
 */

import crypto from "crypto"

function secret(): string {
  return process.env.AUTH_SECRET || "dev-secret"
}

/** Short human-typeable code, e.g. "7GK2-Q9XD" (also embedded in the QR). */
export function passCodeFor(participantId: string): string {
  const digest = crypto
    .createHmac("sha256", secret())
    .update(`pass:${participantId}`)
    .digest("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  return `${digest.slice(0, 4)}-${digest.slice(4, 8)}`
}

export function buildPassPayload(eventId: string, participantId: string): string {
  return `HYKRZ|${eventId}|${participantId}|${passCodeFor(participantId)}`
}

export interface ParsedPass {
  eventId: string
  participantId: string
}

/**
 * Parse + verify a scanned QR payload or a bare typed code.
 * For a bare code the participant must be resolved by the caller (we can only
 * verify codes against a known participant id), so this returns null and the
 * caller falls back to per-participant comparison.
 */
export function verifyPassPayload(payload: string): ParsedPass | null {
  const parts = payload.trim().split("|")
  if (parts.length !== 4 || parts[0] !== "HYKRZ") return null
  const [, eventId, participantId, code] = parts
  if (passCodeFor(participantId) !== code.toUpperCase()) return null
  return { eventId, participantId }
}
