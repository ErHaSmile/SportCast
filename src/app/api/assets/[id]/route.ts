import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";

type Ctx = { params: Promise<{ id: string }> };

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

  if (before.path.startsWith("/uploads/")) {
    const disk = path.join(process.cwd(), "public", before.path.replace(/^\//, ""));
    await unlink(disk).catch(() => undefined);
  }

  await writeOperationLog({
    action: "asset.delete",
    targetType: "Asset",
    targetId: id,
    before,
    operator: session!.username,
  });

  return jsonOk({ ok: true });
}
