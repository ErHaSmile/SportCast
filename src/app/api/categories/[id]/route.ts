import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { canonicalMediaUrl, resolveMediaFields } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.sportCategory.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    slug?: string;
    description?: string;
    coverUrl?: string | null;
    badge?: string;
    sort?: number;
    enabled?: boolean;
  } | null;

  if (body?.slug && body.slug !== before.slug) {
    const clash = await prisma.sportCategory.findUnique({
      where: { slug: body.slug.trim() },
    });
    if (clash) return jsonError("标识 slug 已存在");
  }

  const item = await prisma.sportCategory.update({
    where: { id },
    data: {
      name: body?.name?.trim() || before.name,
      slug: body?.slug?.trim() || before.slug,
      description:
        body?.description === undefined ? before.description : body.description.trim(),
      coverUrl:
        body?.coverUrl === undefined
          ? before.coverUrl
          : canonicalMediaUrl(body.coverUrl) || null,
      badge: body?.badge === undefined ? before.badge : body.badge.trim(),
      sort: body?.sort === undefined ? before.sort : Number(body.sort) || 0,
      enabled: body?.enabled === undefined ? before.enabled : Boolean(body.enabled),
    },
  });

  await writeOperationLog({
    action: "category.update",
    targetType: "SportCategory",
    targetId: id,
    before,
    after: item,
    operator: session!.username,
  });

  const signed = await resolveMediaFields(item, ["coverUrl"]);
  return jsonOk({ item: signed });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.sportCategory.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  await prisma.schedule.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });
  await prisma.sportCategory.delete({ where: { id } });

  await writeOperationLog({
    action: "category.delete",
    targetType: "SportCategory",
    targetId: id,
    before,
    operator: session!.username,
  });

  return jsonOk({ ok: true });
}
