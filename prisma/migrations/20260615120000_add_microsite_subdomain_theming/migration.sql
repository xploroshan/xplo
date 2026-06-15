-- Per-tenant microsite fields for organizer/org subdomains (name.hykrz.com).
ALTER TABLE "User"
  ADD COLUMN "subdomain"  TEXT,
  ADD COLUMN "themeColor" TEXT,
  ADD COLUMN "tagline"    VARCHAR(160);

ALTER TABLE "Organization"
  ADD COLUMN "subdomain"  TEXT,
  ADD COLUMN "themeColor" TEXT,
  ADD COLUMN "tagline"    VARCHAR(160);

CREATE UNIQUE INDEX "User_subdomain_key" ON "User"("subdomain");
CREATE UNIQUE INDEX "Organization_subdomain_key" ON "Organization"("subdomain");
