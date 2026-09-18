import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.stream.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    type?: string;
    url?: string;
    status?: string;
    sort?: number;
    coverUrl?: string | null;
  } | null;

  const status =
    body?.status === "ON" || body?.status === "OFF" ? body.status : before.status;

  const item = await prisma.stream.update({
    where: { id },
    data: {
      name: body?.name?.trim() || before.name,
      type: body?.type === "H5" ? "H5" : body?.type === "HLS" ? "HLS" : before.type,
      url: body?.url?.trim() || before.url,
      status,
      sort: body?.sort === undefined ? before.sort : Number(body.sort) || 0,
      coverUrl:
        body?.coverUrl === undefined ? before.coverUrl : body.coverUrl?.trim() || null,
    },
  });

  if (before.status !== item.status) {
    await writeOperationLog({
      action: "stream.status",
      targetType: "Stream",
      targetId: id,
      before: { status: before.status },
      after: { status: item.status },
      operator: session!.username,
    });
  } else {
    await writeOperationLog({
      action: "stream.update",
      targetType: "Stream",
      targetId: id,
      before,
      after: item,
      operator: session!.username,
    });
  }

  return jsonOk({ item });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.stream.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  await prisma.schedule.updateMany({
    where: { streamId: id },
    data: { streamId: null },
  });
  await prisma.stream.delete({ where: { id } });

  await writeOperationLog({
    action: "stream.delete",
    targetType: "Stream",
    targetId: id,
    before,
    operator: session!.username,
  });

  return jsonOk({ ok: true });
}
