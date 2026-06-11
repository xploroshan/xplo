/**
 * TOTP (authenticator-app) two-factor helpers, wrapping otplib v13's
 * functional API. Self-contained — no external service. 6-digit, 30s window.
 */
import { generateSecret, generateURI, verifySync } from "otplib"

export function generateTotpSecret(): string {
  return generateSecret()
}

/** otpauth:// URI for the QR code the user scans into their authenticator. */
export function totpAuthUri(secret: string, accountName: string): string {
  return generateURI({ issuer: "HYKRZ", label: accountName, secret })
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return verifySync({ secret, token: token.replace(/\s/g, "") }).valid
  } catch {
    return false
  }
}
