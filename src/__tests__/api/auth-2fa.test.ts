import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as ENABLE } from "@/app/api/auth/2fa/enable/route"
import { POST as DISABLE } from "@/app/api/auth/2fa/disable/route"
import { POST as VERIFY_RESEND } from "@/app/api/auth/resend-verification/route"
import { generateTotpSecret, totpAuthUri, verifyTotp } from "@/lib/totp"
import { generateSync } from "otplib"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

function req(body: unknown) {
  return new Request("http://localhost", { method: "POST", body: JSON.stringify(body) })
}

describe("TOTP helpers", () => {
  it("generates a verifiable code", () => {
    const secret = generateTotpSecret()
    const code = generateSync({ secret })
    expect(verifyTotp(code, secret)).toBe(true)
    expect(verifyTotp("000000", secret)).toBe(false)
  })

  it("builds an otpauth uri", () => {
    const uri = totpAuthUri(generateTotpSecret(), "rider@x.com")
    expect(uri).toMatch(/^otpauth:\/\/totp\//)
    expect(uri).toContain("HYKRZ")
  })
})

describe("2FA enable/disable", () => {
  beforeEach(() => vi.clearAllMocks())

  it("enables 2FA with a valid code", async () => {
    const secret = generateTotpSecret()
    const code = generateSync({ secret })
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ twoFactorSecret: secret } as never)
    mockDb.user.update.mockResolvedValue({} as never)

    const res = await ENABLE(req({ code }))
    expect(res.status).toBe(200)
    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { twoFactorEnabled: true } })
    )
  })

  it("rejects a wrong code on enable", async () => {
    const secret = generateTotpSecret()
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ twoFactorSecret: secret } as never)

    const res = await ENABLE(req({ code: "000000" }))
    expect(res.status).toBe(400)
  })

  it("disables 2FA with a valid code", async () => {
    const secret = generateTotpSecret()
    const code = generateSync({ secret })
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ twoFactorSecret: secret, twoFactorEnabled: true } as never)
    mockDb.user.update.mockResolvedValue({} as never)

    const res = await DISABLE(req({ code }))
    expect(res.status).toBe(200)
    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { twoFactorEnabled: false, twoFactorSecret: null } })
    )
  })

  it("requires auth", async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await ENABLE(req({ code: "123456" }))
    expect(res.status).toBe(401)
  })
})

describe("Resend verification", () => {
  beforeEach(() => vi.clearAllMocks())

  it("no-ops cleanly when already verified", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ email: "a@b.com", emailVerified: new Date() } as never)

    const res = await VERIFY_RESEND()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toMatch(/already verified/i)
  })
})
