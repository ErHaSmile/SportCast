import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const item = await prisma.siteConfig.findUnique({ where: { id: "default" } });
  return jsonOk({ item });
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const before = await prisma.siteConfig.findUnique({ where: { id: "default" } });
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body) return jsonError("无效数据");

  const fields = [
    "eventTitle",
    "eventSubtitle",
    "eventDateText",
    "bannerTitle",
    "slogan",
    "sourceText",
    "locationText",
    "hostUnits",
    "organizeUnits",
    "coOrganizeUnits",
    "supportUnits",
    "heroImageUrl",
    "footerLinks",
    "footerCopyright",
    "footerIcp",
    "footerContact",
  ] as const;

  const data: Record<string, string> = {};
  for (const key of fields) {
    if (body[key] !== undefined) data[key] = String(body[key]);
  }

  const item = await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  await writeOperationLog({
    action: "site.update",
    targetType: "SiteConfig",
    targetId: "default",
    before,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item });
}
