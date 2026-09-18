import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";
import { createUploadedAsset, uniqueFilename } from "@/lib/asset-file";
import { VIDEO_MAX_BYTES, VIDEO_MAX_LABEL } from "@/lib/upload-limits";

const ALLOWED = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);

// 大文件经 Node→OSS，最长允许约 30 分钟
export const maxDuration = 1800;


function extFromMime(mime: string, name: string): string {
  if (mime === "video/webm") return "webm";
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/x-msvideo") return "avi";
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && ["mp4", "webm", "mov", "avi"].includes(fromName)) return fromName;
  return "mp4";
}

export async function POST(request: Request) {
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("无效表单");

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("请选择视频文件");

  const name = file.name || "video.mp4";
  const lower = name.toLowerCase();
  const mimeOk =
    ALLOWED.has(file.type) ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov");
  if (!mimeOk) return jsonError("仅支持 MP4 / WEBM / MOV");
  if (file.size > VIDEO_MAX_BYTES) return jsonError(`视频不能超过 ${VIDEO_MAX_LABEL}`);

  const ext = extFromMime(file.type || "video/mp4", name);
  const filename = uniqueFilename(ext);
  const displayName = (form.get("name") as string)?.trim() || undefined;
  const alias = (form.get("alias") as string)?.trim() || undefined;

  try {
    const { item, accessUrl } = await createUploadedAsset({
      kind: "video",
      file,
      filename,
      mime: file.type || `video/${ext}`,
      name: displayName || name,
      alias,
    });

    await writeOperationLog({
      action: "asset.upload.video",
      targetType: "Asset",
      targetId: item.id,
      after: item,
      operator: session!.username,
    });

    return jsonOk({ item, accessUrl }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-video]", msg);
    if (/timeout|Timeout/i.test(msg)) {
      return jsonError(
        "上传到对象存储超时。请确认服务器 .env 已配置同地域内网：OSS_ENDPOINT=oss-cn-shanghai-internal.aliyuncs.com",
        504,
      );
    }
    return jsonError(`视频上传失败：${msg.slice(0, 200)}`, 500);
  }
}
