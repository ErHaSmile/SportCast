import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const items = await prisma.schedule.findMany({
    include: { stream: true },
    orderBy: [{ isReplay: "asc" }, { sort: "asc" }, { startAt: "asc" }],
  });
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
      replayUrl: body.replayUrl?.trim() || null,
      detailUrl: body.detailUrl?.trim() || null,
      coverUrl: body.coverUrl?.trim() || null,
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
