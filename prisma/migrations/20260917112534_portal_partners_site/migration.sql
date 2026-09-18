-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "detailUrl" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "group" TEXT NOT NULL DEFAULT 'PARTNER',
    "logoUrl" TEXT,
    "logoAssetId" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Partner_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "eventTitle" TEXT NOT NULL DEFAULT '赛事直播专题',
    "eventSubtitle" TEXT NOT NULL DEFAULT '',
    "eventDateText" TEXT NOT NULL DEFAULT '',
    "bannerTitle" TEXT NOT NULL DEFAULT '',
    "slogan" TEXT NOT NULL DEFAULT '',
    "sourceText" TEXT NOT NULL DEFAULT '',
    "locationText" TEXT NOT NULL DEFAULT '',
    "hostUnits" TEXT NOT NULL DEFAULT '',
    "organizeUnits" TEXT NOT NULL DEFAULT '',
    "coOrganizeUnits" TEXT NOT NULL DEFAULT '',
    "supportUnits" TEXT NOT NULL DEFAULT '',
    "heroAssetId" TEXT,
    "footerLinks" TEXT NOT NULL DEFAULT '',
    "footerCopyright" TEXT NOT NULL DEFAULT '',
    "footerIcp" TEXT NOT NULL DEFAULT '',
    "footerContact" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_SiteConfig" ("eventDateText", "eventSubtitle", "eventTitle", "heroAssetId", "id") SELECT "eventDateText", "eventSubtitle", "eventTitle", "heroAssetId", "id" FROM "SiteConfig";
DROP TABLE "SiteConfig";
ALTER TABLE "new_SiteConfig" RENAME TO "SiteConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
