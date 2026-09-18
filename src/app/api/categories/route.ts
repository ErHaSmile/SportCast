import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { canonicalMediaUrl, resolveMediaFields, resolveMediaUrl } from "@/lib/storage";

function slugify(input: string) {
  const raw = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || `cat-${Date.now().toString(36)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";

  // 公开列表：仅启用
  if (!all) {
    const rows = await prisma.sportCategory.findMany({
      where: { enabled: true },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { schedules: true },
        },
      },
    });
    const items = await Promise.all(
      rows.map(async (row) => ({
        ...(await resolveMediaFields(row, ["coverUrl"])),
        scheduleCount: row._count.schedules,
      })),
    );
    return jsonOk({ items });
  }

  const { error } = await requireAdminApi();
  if (error) return error;

  const rows = await prisma.sportCategory.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { schedules: true } } },
  });
  const items = await Promise.all(
    rows.map(async (row) => ({
      ...(await resolveMediaFields(row, ["coverUrl"])),
      scheduleCount: row._count.schedules,
    })),
  );
  return jsonOk({ items });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    slug?: string;
    description?: string;
    coverUrl?: string | null;
    badge?: string;
    sort?: number;
    enabled?: boolean;
  } | null;

  if (!body?.name?.trim()) return jsonError("名称必填");

  let slug = (body.slug?.trim() || slugify(body.name)).slice(0, 64);
  const exists = await prisma.sportCategory.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const item = await prisma.sportCategory.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || "",
      coverUrl: canonicalMediaUrl(body.coverUrl) || null,
      badge: body.badge?.trim() || "",
      sort: Number.isFinite(body.sort) ? Number(body.sort) : 0,
      enabled: body.enabled !== false,
    },
  });

  await writeOperationLog({
    action: "category.create",
    targetType: "SportCategory",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  const signed = await resolveMediaUrl(item.coverUrl);
  return jsonOk({ item: { ...item, coverUrl: signed || item.coverUrl } }, { status: 201 });
}
