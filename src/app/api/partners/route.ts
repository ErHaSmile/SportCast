import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { canonicalMediaUrl, resolveMediaFields } from "@/lib/storage";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const rows = await prisma.partner.findMany({
    orderBy: [{ group: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
  });
  const items = await Promise.all(
    rows.map((row) => resolveMediaFields(row, ["logoUrl"])),
  );
  return jsonOk({ items });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    url?: string;
    group?: string;
    logoUrl?: string;
    sort?: number;
    enabled?: boolean;
  } | null;

  if (!body?.name?.trim()) return jsonError("名称必填");

  const group =
    body.group === "HEADER" || body.group === "SPONSOR" ? body.group : "PARTNER";

  const item = await prisma.partner.create({
    data: {
      name: body.name.trim(),
      url: body.url?.trim() || null,
      group,
      logoUrl: canonicalMediaUrl(body.logoUrl) || null,
      sort: Number.isFinite(body.sort) ? Number(body.sort) : 0,
      enabled: body.enabled !== false,
    },
  });

  await writeOperationLog({
    action: "partner.create",
    targetType: "Partner",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item }, { status: 201 });
}
