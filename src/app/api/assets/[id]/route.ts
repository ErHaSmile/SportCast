import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { removeStoredFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    alias?: string;
  } | null;

  const data: { name?: string; alias?: string } = {};
  if (typeof body?.name === "string") data.name = body.name.trim() || before.name;
  if (typeof body?.alias === "string") data.alias = body.alias.trim();

  if (!Object.keys(data).length) return jsonError("没有可更新字段");

  const item = await prisma.asset.update({ where: { id }, data });

  await writeOperationLog({
    action: "asset.update",
    targetType: "Asset",
    targetId: id,
    before,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { session, error } = await requireAdminApi();
  if (error) return error;
  const { id } = await ctx.params;

  const before = await prisma.asset.findUnique({ where: { id } });
  if (!before) return jsonError("不存在", 404);

  await prisma.stream.updateMany({
    where: { coverAssetId: id },
    data: { coverAssetId: null },
  });
  await prisma.schedule.updateMany({
    where: { coverAssetId: id },
    data: { coverAssetId: null },
  });
  await prisma.partner.updateMany({
    where: { logoAssetId: id },
    data: { logoAssetId: null },
  });

  await prisma.asset.delete({ where: { id } });
  await removeStoredFile(before.path);

  await writeOperationLog({
    action: "asset.delete",
    targetType: "Asset",
    targetId: id,
    before,
    operator: session!.username,
  });

  return jsonOk({ ok: true });
}
