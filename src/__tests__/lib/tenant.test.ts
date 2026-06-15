import { describe, it, expect, afterEach } from "vitest"
import { subdomainFromHost, isValidSubdomain } from "@/lib/subdomain"
import { hexToHslTriplet } from "@/lib/color"

const ORIGINAL = process.env.NEXT_PUBLIC_APP_URL
afterEach(() => { process.env.NEXT_PUBLIC_APP_URL = ORIGINAL })

describe("subdomainFromHost (production root)", () => {
  it("extracts a tenant label from <label>.hykrz.com", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://hykrz.com"
    expect(subdomainFromHost("taleson2wheels.hykrz.com")).toBe("taleson2wheels")
    expect(subdomainFromHost("taleson2wheels.hykrz.com:443")).toBe("taleson2wheels")
  })

  it("returns null for the apex and reserved labels", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://hykrz.com"
    expect(subdomainFromHost("hykrz.com")).toBeNull()
    expect(subdomainFromHost("www.hykrz.com")).toBeNull()
    expect(subdomainFromHost("app.hykrz.com")).toBeNull()
    expect(subdomainFromHost("api.hykrz.com")).toBeNull()
  })

  it("ignores unrelated apex domains and empty hosts", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://hykrz.com"
    expect(subdomainFromHost("example.com")).toBeNull()
    expect(subdomainFromHost("")).toBeNull()
    expect(subdomainFromHost(null)).toBeNull()
  })
})

describe("subdomainFromHost (localhost dev)", () => {
  it("handles <label>.localhost and bare localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
    expect(subdomainFromHost("taleson2wheels.localhost")).toBe("taleson2wheels")
    expect(subdomainFromHost("taleson2wheels.localhost:3000")).toBe("taleson2wheels")
    expect(subdomainFromHost("localhost")).toBeNull()
    expect(subdomainFromHost("localhost:3000")).toBeNull()
  })
})

describe("isValidSubdomain", () => {
  it("accepts valid labels", () => {
    expect(isValidSubdomain("taleson2wheels")).toBe(true)
    expect(isValidSubdomain("ab")).toBe(true)
    expect(isValidSubdomain("a-b-c")).toBe(true)
  })
  it("rejects invalid / reserved labels", () => {
    expect(isValidSubdomain("a")).toBe(false)        // too short
    expect(isValidSubdomain("UPPER")).toBe(false)    // uppercase
    expect(isValidSubdomain("has space")).toBe(false)
    expect(isValidSubdomain("-lead")).toBe(false)
    expect(isValidSubdomain("www")).toBe(false)      // reserved
    expect(isValidSubdomain("admin")).toBe(false)    // reserved
  })
})

describe("hexToHslTriplet", () => {
  it("converts hex to the CSS HSL triplet", () => {
    expect(hexToHslTriplet("#e11d48")).toBe("347 77% 50%")
    expect(hexToHslTriplet("#ffffff")).toBe("0 0% 100%")
    expect(hexToHslTriplet("#000000")).toBe("0 0% 0%")
    expect(hexToHslTriplet("e11d48")).toBe("347 77% 50%") // no leading #
  })
  it("returns null for invalid input", () => {
    expect(hexToHslTriplet("nope")).toBeNull()
    expect(hexToHslTriplet("")).toBeNull()
    expect(hexToHslTriplet(null)).toBeNull()
  })
})
