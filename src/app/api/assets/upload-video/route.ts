import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";

const ALLOWED = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime", // mov
  "video/x-msvideo", // avi
]);
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

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

  // 部分浏览器 mov 的 type 为空，按扩展名兜底
  const name = file.name || "video.mp4";
  const lower = name.toLowerCase();
  const mimeOk =
    ALLOWED.has(file.type) ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov");
  if (!mimeOk) return jsonError("仅支持 MP4 / WEBM / MOV");
  if (file.size > MAX_SIZE) return jsonError("视频不能超过 200MB");

  const ext = extFromMime(file.type || "video/mp4", name);
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  const publicPath = `/uploads/videos/${filename}`;
  const item = await prisma.asset.create({
    data: {
      name: name,
      path: publicPath,
      mime: file.type || `video/${ext}`,
      size: file.size,
    },
  });

  await writeOperationLog({
    action: "asset.upload.video",
    targetType: "Asset",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item }, { status: 201 });
}
