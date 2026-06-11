-- Supports the event-chat delta poll (WHERE "eventId" = ? AND "updatedAt" > ?
-- ORDER BY "updatedAt"). Created concurrently is not used here so it stays
-- inside the transactional migration; the table is small at MVP volume.
CREATE INDEX "Message_eventId_updatedAt_idx" ON "Message"("eventId", "updatedAt");
