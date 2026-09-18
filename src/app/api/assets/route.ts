import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { createUploadedAsset, imageExt, uniqueFilename } from "@/lib/asset-file";
import { resolveMediaUrl } from "@/lib/storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export const maxDuration = 60;

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const rows = await prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
  });
  const items = await Promise.all(
    rows.map(async (item) => ({
      ...item,
      accessUrl: await resolveMediaUrl(item.path, {
        kind: item.mime.startsWith("video/") ? "video" : "image",
      }),
    })),
  );
  return jsonOk({ items });
}

export async function POST(request: Request) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("无效表单");

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("请选择文件");
  if (!ALLOWED.has(file.type)) return jsonError("仅支持 JPG / PNG / WEBP / GIF");
  if (file.size > MAX_SIZE) return jsonError("图片不能超过 5MB");

  const filename = uniqueFilename(imageExt(file.type));
  const name = (form.get("name") as string)?.trim() || undefined;
  const { item, accessUrl } = await createUploadedAsset({
    kind: "image",
    file,
    filename,
    mime: file.type,
    name,
  });

  await writeOperationLog({
    action: "asset.upload",
    targetType: "Asset",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item, accessUrl }, { status: 201 });
}
