import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { canonicalMediaUrl, resolveMediaFields } from "@/lib/storage";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const rows = await prisma.schedule.findMany({
    include: { stream: true, category: true },
    orderBy: [{ isReplay: "asc" }, { sort: "asc" }, { startAt: "asc" }],
  });
  const items = await Promise.all(
    rows.map(async (row) => {
      const signed = await resolveMediaFields(row, ["coverUrl", "replayUrl"]);
      if (signed.stream) {
        signed.stream = await resolveMediaFields(signed.stream, ["coverUrl"]);
      }
      return signed;
    }),
  );
  return jsonOk({ items });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    location?: string;
    startAt?: string;
    endAt?: string;
    streamId?: string | null;
    categoryId?: string | null;
    replayUrl?: string;
    detailUrl?: string;
    coverUrl?: string | null;
    summary?: string;
    content?: string;
    sort?: number;
    isReplay?: boolean;
  } | null;

  if (!body?.title?.trim() || !body?.startAt) {
    return jsonError("标题和开始时间必填");
  }

  const item = await prisma.schedule.create({
    data: {
      title: body.title.trim(),
      location: body.location?.trim() || null,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      streamId: body.streamId || null,
      categoryId: body.categoryId || null,
      replayUrl: canonicalMediaUrl(body.replayUrl) || null,
      detailUrl: body.detailUrl?.trim() || null,
      coverUrl: canonicalMediaUrl(body.coverUrl) || null,
      summary: body.summary?.trim() || "",
      content: body.content?.trim() || "",
      sort: Number.isFinite(body.sort) ? Number(body.sort) : 0,
      isReplay: Boolean(body.isReplay),
    },
  });

  await writeOperationLog({
    action: "schedule.create",
    targetType: "Schedule",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item }, { status: 201 });
}
