// Side-effect-free shared constants for the E2E suite (imported by specs,
// global-setup, and the seed script — keep this free of Prisma/DB imports).

export const E2E_PASSWORD = "E2e!pass123"

export const E2E_USERS = {
  rider: "rider@e2e.test",
  organizer: "organizer@e2e.test",
  admin: "admin@e2e.test",
} as const

export const E2E_ORG_SLUG = "e2e-club"

export const E2E_EVENTS = {
  free: "e2e-free-ride",
  full: "e2e-full-ride",
  completed: "e2e-completed-ride",
  draft: "e2e-draft-ride",
  member: "e2e-member-ride",
} as const
