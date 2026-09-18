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

  const before = await prisma.schedule.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    location?: string | null;
    startAt?: string;
    endAt?: string | null;
    streamId?: string | null;
    replayUrl?: string | null;
    detailUrl?: string | null;
    coverUrl?: string | null;
    summary?: string;
    content?: string;
    sort?: number;
    isReplay?: boolean;
  } | null;

  const item = await prisma.schedule.update({
    where: { id },
    data: {
      title: body?.title?.trim() || before.title,
      location:
        body?.location === undefined ? before.location : body.location?.trim() || null,
      startAt: body?.startAt ? new Date(body.startAt) : before.startAt,
      endAt:
        body?.endAt === undefined
          ? before.endAt
          : body.endAt
            ? new Date(body.endAt)
            : null,
      streamId: body?.streamId === undefined ? before.streamId : body.streamId || null,
      replayUrl:
        body?.replayUrl === undefined
          ? before.replayUrl
          : canonicalMediaUrl(body.replayUrl) || null,
      detailUrl:
        body?.detailUrl === undefined
          ? before.detailUrl
          : body.detailUrl?.trim() || null,
      coverUrl:
        body?.coverUrl === undefined
          ? before.coverUrl
          : canonicalMediaUrl(body.coverUrl) || null,
      summary: body?.summary === undefined ? before.summary : body.summary.trim(),
      content: body?.content === undefined ? before.content : body.content.trim(),
      sort: body?.sort === undefined ? before.sort : Number(body.sort) || 0,
      isReplay: body?.isReplay === undefined ? before.isReplay : Boolean(body.isReplay),
    },
  });

  await writeOperationLog({
    action: "schedule.update",
    targetType: "Schedule",
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

  const before = await prisma.schedule.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  await prisma.schedule.delete({ where: { id } });
  await writeOperationLog({
    action: "schedule.delete",
    targetType: "Schedule",
    targetId: id,
    before,
    operator: session!.username,
  });

  return jsonOk({ ok: true });
}
