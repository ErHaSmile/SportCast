import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { putStoredFile, resolveMediaUrl, type StorageKind } from "@/lib/storage";

export function imageExt(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function uniqueFilename(ext: string) {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}

export async function createUploadedAsset(opts: {
  kind: StorageKind;
  file: File;
  filename: string;
  mime: string;
  name?: string;
  alias?: string;
}) {
  const stored = await putStoredFile({
    kind: opts.kind,
    filename: opts.filename,
    file: opts.file,
    contentType: opts.mime,
  });
  const item = await prisma.asset.create({
    data: {
      name: opts.name?.trim() || opts.file.name || opts.filename,
      alias: opts.alias?.trim() || "",
      path: stored.url,
      mime: opts.mime,
      size: opts.file.size,
    },
  });
  const accessUrl = await resolveMediaUrl(item.path, { kind: opts.kind });
  return { item, accessUrl };
}
