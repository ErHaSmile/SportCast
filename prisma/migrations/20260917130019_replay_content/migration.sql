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
    CONSTRAINT "Schedule_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("coverAssetId", "coverUrl", "createdAt", "detailUrl", "endAt", "id", "isReplay", "location", "replayUrl", "sort", "startAt", "streamId", "title", "updatedAt") SELECT "coverAssetId", "coverUrl", "createdAt", "detailUrl", "endAt", "id", "isReplay", "location", "replayUrl", "sort", "startAt", "streamId", "title", "updatedAt" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
