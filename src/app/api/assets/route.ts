import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAdminApi } from "@/lib/api";
import { writeOperationLog } from "@/lib/log";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const items = await prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
  });
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

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const publicPath = `/uploads/${filename}`;
  const name = (form.get("name") as string)?.trim() || file.name || filename;

  const item = await prisma.asset.create({
    data: {
      name,
      path: publicPath,
      mime: file.type,
      size: file.size,
    },
  });

  await writeOperationLog({
    action: "asset.upload",
    targetType: "Asset",
    targetId: item.id,
    after: item,
    operator: session!.username,
  });

  return jsonOk({ item }, { status: 201 });
}
