-- CreateTable
CREATE TABLE "LocationPing" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationPing_eventId_userId_recordedAt_idx" ON "LocationPing"("eventId", "userId", "recordedAt");

-- CreateIndex
CREATE INDEX "LocationPing_recordedAt_idx" ON "LocationPing"("recordedAt");

-- AddForeignKey
ALTER TABLE "LocationPing" ADD CONSTRAINT "LocationPing_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPing" ADD CONSTRAINT "LocationPing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
