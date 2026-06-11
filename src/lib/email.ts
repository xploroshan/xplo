/**
 * Transactional email via Resend.
 *
 * Activates when RESEND_API_KEY is set. If it isn't (local dev or before the
 * key is configured in Vercel), sendEmail() logs and no-ops instead of throwing,
 * so callers never hard-fail on a missing key.
 */

import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Verify your own domain in Resend, then set EMAIL_FROM (e.g. "HYKRZ <noreply@hykrz.com>").
// Falls back to Resend's shared onboarding sender, which only delivers to the
// account owner's address — fine for first testing.
const FROM = process.env.EMAIL_FROM || "HYKRZ <onboarding@resend.dev>"

/** Absolute base URL for links in emails. */
export function appUrl(): string {
  return (
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface SendEmailArgs {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
  replyTo?: string
}

export async function sendEmail(
  args: SendEmailArgs
): Promise<{ sent: boolean; error?: string }> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping email "${args.subject}" to ${args.to}`
    )
    return { sent: false, error: "email-not-configured" }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })
    if (error) {
      console.error("[email] Resend error:", error)
      return { sent: false, error: String(error) }
    }
    return { sent: true }
  } catch (err) {
    console.error("[email] send failed:", err)
    return { sent: false, error: err instanceof Error ? err.message : "unknown" }
  }
}

// ── Shared template chrome ──────────────────────────────────────────────────

function layout(heading: string, body: string, cta?: { label: string; url: string }): string {
  const button = cta
    ? `<a href="${cta.url}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:8px 0">${cta.label}</a>`
    : ""
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;color:#e4e4e7">
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#fff;margin-bottom:24px">HYKRZ</div>
    <h1 style="font-size:20px;color:#fff;margin:0 0 12px">${heading}</h1>
    <div style="font-size:15px;line-height:1.6;color:#a1a1aa">${body}</div>
    ${button}
    <hr style="border:none;border-top:1px solid #27272a;margin:28px 0" />
    <div style="font-size:12px;color:#52525b">You're receiving this because you have a HYKRZ account.</div>
  </div></body></html>`
}

// ── Templates ───────────────────────────────────────────────────────────────

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Reset your HYKRZ password",
    html: layout(
      "Reset your password",
      "We received a request to reset your password. This link expires in 1 hour. If you didn't request it, you can safely ignore this email.",
      { label: "Reset password", url: resetUrl }
    ),
    text: `Reset your HYKRZ password (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  }
}

const STATUS_COPY: Record<string, string> = {
  CONFIRMED: "You're confirmed — see you there!",
  WAITLISTED: "The event is full, so you're on the waitlist. We'll email you if a spot opens up.",
  PENDING: "Your request has been sent to the organizer for approval.",
}

export function rsvpConfirmationEmail(args: {
  eventTitle: string
  eventUrl: string
  whenText: string
  status: string
}): { subject: string; html: string; text: string } {
  const status = STATUS_COPY[args.status] ?? "You're registered."
  return {
    subject: `You're registered: ${args.eventTitle}`,
    html: layout(
      args.eventTitle,
      `${status}<br/><br/><strong>When:</strong> ${args.whenText}<br/><br/>A calendar invite is attached.`,
      { label: "View event", url: args.eventUrl }
    ),
    text: `${args.eventTitle}\n${status}\nWhen: ${args.whenText}\n${args.eventUrl}`,
  }
}

export function verifyEmailEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Verify your HYKRZ email",
    html: layout(
      "Confirm your email",
      "Tap below to verify your email address and unlock everything on HYKRZ. This link expires in 24 hours.",
      { label: "Verify email", url: verifyUrl }
    ),
    text: `Verify your HYKRZ email (expires in 24 hours):\n${verifyUrl}`,
  }
}

export function eventAnnouncementEmail(args: {
  eventTitle: string
  eventUrl: string
  message: string
  organizerName: string
}): { subject: string; html: string; text: string } {
  return {
    subject: `Update: ${args.eventTitle}`,
    html: layout(
      `Update from ${args.organizerName}`,
      `${args.message.replace(/\n/g, "<br/>")}<br/><br/><em>Re: ${args.eventTitle}</em>`,
      { label: "View event", url: args.eventUrl }
    ),
    text: `Update from ${args.organizerName} re: ${args.eventTitle}\n\n${args.message}\n\n${args.eventUrl}`,
  }
}
