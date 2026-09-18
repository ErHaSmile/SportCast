-- CreateTable
CREATE TABLE "SportCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "coverAssetId" TEXT,
    "badge" TEXT NOT NULL DEFAULT '',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SportCategory_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SportCategory_slug_key" ON "SportCategory"("slug");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "streamId" TEXT,
    "categoryId" TEXT,
    "replayUrl" TEXT,
    "detailUrl" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "coverAssetId" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isReplay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Schedule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SportCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Schedule_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("id", "title", "location", "startAt", "endAt", "streamId", "replayUrl", "detailUrl", "summary", "content", "coverUrl", "coverAssetId", "sort", "isReplay", "createdAt", "updatedAt")
SELECT "id", "title", "location", "startAt", "endAt", "streamId", "replayUrl", "detailUrl", "summary", "content", "coverUrl", "coverAssetId", "sort", "isReplay", "createdAt", "updatedAt" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
CREATE INDEX "Schedule_categoryId_idx" ON "Schedule"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
