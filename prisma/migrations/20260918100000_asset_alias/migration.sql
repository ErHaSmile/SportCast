-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "alias" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Asset_alias_idx" ON "Asset"("alias");

-- CreateIndex
CREATE INDEX "Asset_name_idx" ON "Asset"("name");
