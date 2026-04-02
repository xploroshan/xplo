/**
 * Basic HTML sanitization — strips HTML tags from user input.
 * Applied at API boundaries before storing in database.
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim()
}
