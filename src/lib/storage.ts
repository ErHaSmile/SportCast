import { createWriteStream } from "fs";
import { mkdir, unlink, writeFile, rm, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export type StorageKind = "image" | "video";

type PutResult = { url: string; key: string };

function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function storageDriver(): "local" | "oss" {
  const forced = env("STORAGE_DRIVER").toLowerCase();
  if (forced === "oss" || forced === "local") return forced;
  if (env("OSS_BUCKET") && env("OSS_ACCESS_KEY_ID") && env("OSS_ACCESS_KEY_SECRET")) {
    return "oss";
  }
  return "local";
}

function ossRegion() {
  const raw = env("OSS_REGION") || "oss-cn-hangzhou";
  return raw.startsWith("oss-") ? raw : `oss-${raw}`;
}

function ossPrefix() {
  return env("OSS_PREFIX").replace(/^\/+|\/+$/g, "") || "sportcast";
}

/** 浏览器可访问的外网 / CDN 根地址（签名链接必须用这个，不能用内网 endpoint） */
function ossPublicBase() {
  const custom = env("OSS_PUBLIC_BASE").replace(/\/$/, "");
  if (custom) return custom;
  const bucket = env("OSS_BUCKET");
  return `https://${bucket}.${ossRegion()}.aliyuncs.com`;
}

function objectKey(kind: StorageKind, filename: string) {
  const folder = kind === "video" ? "videos" : "images";
  return `${ossPrefix()}/${folder}/${filename}`;
}

function localPublicPath(kind: StorageKind, filename: string) {
  return kind === "video" ? `/uploads/videos/${filename}` : `/uploads/${filename}`;
}

function localDiskPath(kind: StorageKind, filename: string) {
  const dir =
    kind === "video"
      ? path.join(process.cwd(), "public", "uploads", "videos")
      : path.join(process.cwd(), "public", "uploads");
  return { dir, disk: path.join(dir, filename) };
}

function defaultSignExpires(kindHint?: StorageKind) {
  const raw = env("OSS_SIGN_EXPIRES");
  if (raw && Number.isFinite(Number(raw))) return Math.max(60, Number(raw));
  return kindHint === "video" ? 6 * 3600 : 2 * 3600;
}

async function ossClient(mode: "upload" | "sign") {
  const OSS = (await import("ali-oss")).default;
  const bucket = env("OSS_BUCKET");
  const accessKeyId = env("OSS_ACCESS_KEY_ID");
  const accessKeySecret = env("OSS_ACCESS_KEY_SECRET");
  if (!bucket || !accessKeyId || !accessKeySecret) {
    throw new Error("对象存储未配置完整：需要 OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET");
  }

  // 上传：同地域 ECS 务必走内网 endpoint，公网易超时（默认 60s）
  // 签名：给浏览器必须用公网 / CDN
  const uploadEndpoint = env("OSS_ENDPOINT") || undefined;
  const cname = mode === "sign" && Boolean(env("OSS_PUBLIC_BASE"));

  return new OSS({
    region: ossRegion(),
    accessKeyId,
    accessKeySecret,
    bucket,
    endpoint: mode === "upload" ? uploadEndpoint : mode === "sign" && cname ? env("OSS_PUBLIC_BASE") : undefined,
    cname: mode === "sign" ? cname : false,
    secure: true,
    authorizationV4: true,
    // 分片上传大视频，默认 60s 不够
    timeout: 10 * 60 * 1000,
  });
}

async function writeTempFile(file: File) {
  const dir = await mkdtemp(path.join(tmpdir(), "sportcast-"));
  const dest = path.join(dir, "upload.bin");
  const nodeStream = Readable.fromWeb(
    file.stream() as unknown as import("stream/web").ReadableStream,
  );
  await pipeline(nodeStream, createWriteStream(dest));
  return { dir, dest };
}

/** 去掉签名参数，得到可入库的稳定地址 */
export function canonicalMediaUrl(url: string | null | undefined): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw.split("?")[0];
  try {
    const u = new URL(raw);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return raw.split("?")[0];
  }
}

export function keyFromStoredUrl(url: string): string | null {
  const clean = canonicalMediaUrl(url);
  if (!clean || clean.startsWith("/")) return null;

  const bases = [env("OSS_PUBLIC_BASE").replace(/\/$/, ""), ossPublicBase()].filter(
    Boolean,
  );
  for (const base of [...new Set(bases)]) {
    if (clean.startsWith(`${base}/`)) {
      return decodeURIComponent(clean.slice(base.length + 1));
    }
  }
  try {
    const pathname = new URL(clean).pathname.replace(/^\//, "");
    const prefix = ossPrefix();
    if (pathname.startsWith(`${prefix}/`)) return decodeURIComponent(pathname);
  } catch {
    return null;
  }
  return null;
}

export function isOurStoredObject(url: string): boolean {
  const clean = canonicalMediaUrl(url);
  if (clean.startsWith("/uploads/")) return true;
  return Boolean(keyFromStoredUrl(clean));
}

/** 私有对象 → 临时签名 URL；本地 / 外链原样返回 */
export async function resolveMediaUrl(
  url: string | null | undefined,
  opts?: { expires?: number; kind?: StorageKind },
): Promise<string> {
  const clean = canonicalMediaUrl(url);
  if (!clean) return "";
  if (clean.startsWith("/")) return clean;
  if (storageDriver() !== "oss") return clean;

  const key = keyFromStoredUrl(clean);
  if (!key) return clean;

  const client = await ossClient("sign");
  const expires = opts?.expires ?? defaultSignExpires(opts?.kind);
  return client.signatureUrl(key, { expires });
}

export async function resolveMediaFields<T extends Record<string, unknown>>(
  item: T,
  fields: (keyof T)[],
  opts?: { expires?: number; kind?: StorageKind },
): Promise<T> {
  const next = { ...item };
  await Promise.all(
    fields.map(async (field) => {
      const value = item[field];
      if (typeof value === "string" && value) {
        (next as Record<string, unknown>)[field as string] = await resolveMediaUrl(
          value,
          opts,
        );
      }
    }),
  );
  return next;
}

export async function putStoredFile(opts: {
  kind: StorageKind;
  filename: string;
  file: File;
  contentType: string;
}): Promise<PutResult> {
  const driver = storageDriver();
  if (driver === "local") {
    const { dir, disk } = localDiskPath(opts.kind, opts.filename);
    await mkdir(dir, { recursive: true });
    if (opts.kind === "video") {
      const tmp = await writeTempFile(opts.file);
      try {
        const { copyFile } = await import("fs/promises");
        await copyFile(tmp.dest, disk);
      } finally {
        await rm(tmp.dir, { recursive: true, force: true });
      }
    } else {
      await writeFile(disk, Buffer.from(await opts.file.arrayBuffer()));
    }
    const url = localPublicPath(opts.kind, opts.filename);
    return { url, key: url };
  }

  const key = objectKey(opts.kind, opts.filename);
  const client = await ossClient("upload");
  const headers = { "Content-Type": opts.contentType };

  if (opts.kind === "video") {
    const tmp = await writeTempFile(opts.file);
    try {
      await client.multipartUpload(key, tmp.dest, {
        mime: opts.contentType,
        headers,
        // 5MB 分片；内网通常很快，公网也更稳
        partSize: 5 * 1024 * 1024,
        parallel: 2,
        timeout: 10 * 60 * 1000,
      });
    } finally {
      await rm(tmp.dir, { recursive: true, force: true });
    }
  } else {
    await client.put(key, Buffer.from(await opts.file.arrayBuffer()), {
      mime: opts.contentType,
      headers,
    });
  }

  return { url: `${ossPublicBase()}/${key}`, key };
}

/** @deprecated 使用 putStoredFile */
export const putPublicFile = putStoredFile;

export async function removeStoredFile(publicUrl: string) {
  const url = canonicalMediaUrl(publicUrl);
  if (!url) return;

  if (url.startsWith("/uploads/")) {
    const disk = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    await unlink(disk).catch(() => undefined);
    return;
  }

  if (storageDriver() !== "oss") return;
  const key = keyFromStoredUrl(url);
  if (!key) return;
  const client = await ossClient("upload");
  await client.delete(key).catch(() => undefined);
}
