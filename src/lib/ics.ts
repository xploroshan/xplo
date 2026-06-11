/**
 * Minimal iCalendar (.ics) generation + a Google Calendar "add event" link.
 * Used for RSVP confirmation attachments and the event page's "Add to calendar".
 */

export interface IcsEvent {
  id: string
  title: string
  description?: string | null
  start: Date
  end?: Date | null
  location?: string | null
  url?: string
}

// UTC timestamp in iCal basic format: 20260611T093000Z
function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

// Default an open-ended event to a 2-hour block so calendars render it sanely.
function endOf(e: IcsEvent): Date {
  return e.end ?? new Date(e.start.getTime() + 2 * 60 * 60 * 1000)
}

export function buildIcs(e: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HYKRZ//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@hykrz.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(e.start)}`,
    `DTEND:${fmt(endOf(e))}`,
    `SUMMARY:${esc(e.title)}`,
    e.description ? `DESCRIPTION:${esc(e.description)}` : null,
    e.location ? `LOCATION:${esc(e.location)}` : null,
    e.url ? `URL:${esc(e.url)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[]
  return lines.join("\r\n")
}

export function googleCalendarUrl(e: IcsEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(e.start)}/${fmt(endOf(e))}`,
    details: e.description ?? "",
    location: e.location ?? "",
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
