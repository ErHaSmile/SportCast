-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "coverUrl" TEXT;

-- AlterTable
ALTER TABLE "Stream" ADD COLUMN "coverUrl" TEXT;

-- CreateTable
CREATE TABLE "PageVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "ip" TEXT NOT NULL DEFAULT '',
    "ua" TEXT NOT NULL DEFAULT '',
    "referer" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "footerLinks" TEXT NOT NULL DEFAULT '',
    "footerCopyright" TEXT NOT NULL DEFAULT '',
    "footerIcp" TEXT NOT NULL DEFAULT '',
    "footerContact" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_SiteConfig" ("bannerTitle", "coOrganizeUnits", "eventDateText", "eventSubtitle", "eventTitle", "footerContact", "footerCopyright", "footerIcp", "footerLinks", "heroAssetId", "hostUnits", "id", "locationText", "organizeUnits", "slogan", "sourceText", "supportUnits") SELECT "bannerTitle", "coOrganizeUnits", "eventDateText", "eventSubtitle", "eventTitle", "footerContact", "footerCopyright", "footerIcp", "footerLinks", "heroAssetId", "hostUnits", "id", "locationText", "organizeUnits", "slogan", "sourceText", "supportUnits" FROM "SiteConfig";
DROP TABLE "SiteConfig";
ALTER TABLE "new_SiteConfig" RENAME TO "SiteConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PageVisit_createdAt_idx" ON "PageVisit"("createdAt");

-- CreateIndex
CREATE INDEX "PageVisit_path_idx" ON "PageVisit"("path");
