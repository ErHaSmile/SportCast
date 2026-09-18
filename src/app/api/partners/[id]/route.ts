import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { canonicalMediaUrl } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.partner.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    url?: string | null;
    group?: string;
    logoUrl?: string | null;
    sort?: number;
    enabled?: boolean;
  } | null;

  const group =
    body?.group === "HEADER" || body?.group === "SPONSOR" || body?.group === "PARTNER"
      ? body.group
      : before.group;

  const item = await prisma.partner.update({
    where: { id },
    data: {
      name: body?.name?.trim() || before.name,
      url: body?.url === undefined ? before.url : body.url?.trim() || null,
      group,
      logoUrl:
        body?.logoUrl === undefined
          ? before.logoUrl
          : canonicalMediaUrl(body.logoUrl) || null,
      sort: body?.sort === undefined ? before.sort : Number(body.sort) || 0,
      enabled: body?.enabled === undefined ? before.enabled : Boolean(body.enabled),
    },
  });

  await writeOperationLog({
    action: "partner.update",
    targetType: "Partner",
    targetId: id,
    before,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.partner.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  await prisma.partner.delete({ where: { id } });
  await writeOperationLog({
    action: "partner.delete",
    targetType: "Partner",
    targetId: id,
    before,
    operator: session!.username,
  });

  return jsonOk({ ok: true });
}
