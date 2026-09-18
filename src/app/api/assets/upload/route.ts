import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { createUploadedAsset, imageExt, uniqueFilename } from "@/lib/asset-file";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export const maxDuration = 60;

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
  const alias = (form.get("alias") as string)?.trim() || undefined;
  const { item, accessUrl } = await createUploadedAsset({
    kind: "image",
    file,
    filename,
    mime: file.type,
    name,
    alias,
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
