-- Microsite content: tenant-scoped blogs + guidelines.
CREATE TABLE "BlogPost" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT,
  "userId"         TEXT,
  "title"          TEXT NOT NULL,
  "slug"           TEXT NOT NULL,
  "excerpt"        VARCHAR(300),
  "content"        TEXT NOT NULL,
  "coverImage"     TEXT,
  "tags"           TEXT[],
  "status"         TEXT NOT NULL DEFAULT 'draft',
  "publishedAt"    TIMESTAMP(3),
  "authorId"       TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogPost_organizationId_slug_key" ON "BlogPost"("organizationId", "slug");
CREATE UNIQUE INDEX "BlogPost_userId_slug_key" ON "BlogPost"("userId", "slug");
CREATE INDEX "BlogPost_organizationId_status_publishedAt_idx" ON "BlogPost"("organizationId", "status", "publishedAt");
CREATE INDEX "BlogPost_userId_status_publishedAt_idx" ON "BlogPost"("userId", "status", "publishedAt");

CREATE TABLE "Guideline" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT,
  "userId"         TEXT,
  "title"          TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "category"       TEXT,
  "icon"           TEXT,
  "sortOrder"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Guideline_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Guideline_organizationId_sortOrder_idx" ON "Guideline"("organizationId", "sortOrder");
CREATE INDEX "Guideline_userId_sortOrder_idx" ON "Guideline"("userId", "sortOrder");
