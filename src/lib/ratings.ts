import { db } from "@/lib/db"

/**
 * Recalculate an organizer's average rating from all their events' participant ratings.
 */
export async function recalcOrganizerRating(
  userId: string
): Promise<{ avg: number | null; count: number }> {
  const result = await db.eventParticipant.aggregate({
    where: {
      event: { organizerId: userId },
      rating: { not: null },
    },
    _avg: { rating: true },
    _count: { rating: true },
  })

  const avg = result._avg.rating
  const count = result._count.rating

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { ratingLocked: true },
  })

  if (!user?.ratingLocked) {
    await db.user.update({
      where: { id: userId },
      data: { ratingOverride: avg },
    })
  }

  return { avg, count }
}

/**
 * Recalculate an organization's combined rating from all org events' participant ratings.
 */
export async function recalcOrganizationRating(
  orgId: string
): Promise<{ avg: number | null; count: number }> {
  const result = await db.eventParticipant.aggregate({
    where: {
      event: { organizationId: orgId },
      rating: { not: null },
    },
    _avg: { rating: true },
    _count: { rating: true },
  })

  const avg = result._avg.rating
  const count = result._count.rating

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { ratingLocked: true },
  })

  if (!org?.ratingLocked) {
    await db.organization.update({
      where: { id: orgId },
      data: {
        avgRating: avg,
        ratingCount: count,
      },
    })
  }

  return { avg, count }
}

/**
 * Get effective rating -- if override exists and locked, use override; otherwise use calculated.
 */
export function getEffectiveRating(
  calculated: number | null,
  override: number | null,
  locked: boolean
): number | null {
  if (locked && override !== null) {
    return override
  }
  return calculated
}

/**
 * Super Admin override with audit logging -- creates RatingOverrideLog entry.
 * Pass newValue as null to clear an override.
 */
export async function overrideRating(
  adminId: string,
  targetType: "organization" | "user" | "event",
  targetId: string,
  newValue: number | null,
  reason: string
): Promise<void> {
  let previousValue: number | null = null

  if (targetType === "organization") {
    const org = await db.organization.findUniqueOrThrow({
      where: { id: targetId },
      select: { ratingOverride: true },
    })
    previousValue = org.ratingOverride

    await db.organization.update({
      where: { id: targetId },
      data: {
        ratingOverride: newValue,
        ratingLocked: newValue !== null,
      },
    })
  } else if (targetType === "user") {
    const user = await db.user.findUniqueOrThrow({
      where: { id: targetId },
      select: { ratingOverride: true },
    })
    previousValue = user.ratingOverride

    await db.user.update({
      where: { id: targetId },
      data: {
        ratingOverride: newValue,
        ratingLocked: newValue !== null,
      },
    })
  }

  await db.ratingOverrideLog.create({
    data: {
      targetType,
      targetId,
      previousValue,
      newValue,
      reason,
      adminId,
    },
  })
}
