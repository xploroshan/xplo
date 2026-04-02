import { describe, it, expect } from "vitest"
import { sanitizeInput } from "@/lib/sanitize"

describe("sanitizeInput", () => {
  it("strips HTML script tags", () => {
    expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello')
  })

  it("strips HTML tags but keeps text content", () => {
    expect(sanitizeInput("<b>Bold</b> and <i>italic</i>")).toBe("Bold and italic")
  })

  it("handles clean text without changes", () => {
    expect(sanitizeInput("Hello World")).toBe("Hello World")
  })

  it("trims whitespace", () => {
    expect(sanitizeInput("  Hello  ")).toBe("Hello")
  })

  it("strips nested tags", () => {
    expect(sanitizeInput("<div><p>Nested</p></div>")).toBe("Nested")
  })

  it("handles empty string", () => {
    expect(sanitizeInput("")).toBe("")
  })

  it("strips img tags with onerror XSS", () => {
    expect(sanitizeInput('<img src=x onerror="alert(1)">')).toBe("")
  })

  it("strips anchor tags", () => {
    expect(sanitizeInput('<a href="http://evil.com">Click</a>')).toBe("Click")
  })
})
