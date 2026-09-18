import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { canonicalMediaUrl, resolveMediaFields } from "@/lib/storage";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const rows = await prisma.stream.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });
  const items = await Promise.all(
    rows.map((row) => resolveMediaFields(row, ["coverUrl"])),
  );
  return jsonOk({ items });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    type?: string;
    url?: string;
    status?: string;
    sort?: number;
    coverUrl?: string | null;
  } | null;

  if (!body?.name?.trim() || !body?.url?.trim()) {
    return jsonError("名称和地址必填");
  }

  const type = body.type === "H5" ? "H5" : "HLS";
  const status = body.status === "ON" ? "ON" : "OFF";

  const item = await prisma.stream.create({
    data: {
      name: body.name.trim(),
      type,
      url: body.url.trim(),
      status,
      sort: Number.isFinite(body.sort) ? Number(body.sort) : 0,
      coverUrl: canonicalMediaUrl(body.coverUrl) || null,
    },
  });

  await writeOperationLog({
    action: "stream.create",
    targetType: "Stream",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item }, { status: 201 });
}
