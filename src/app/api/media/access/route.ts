import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import {
  canonicalMediaUrl,
  isOurStoredObject,
  resolveMediaUrl,
  storageDriver,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

/** 将库内稳定地址换成短时签名链接（仅限本站对象） */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") || "";
  const url = canonicalMediaUrl(raw);
  if (!url) return jsonError("缺少 url");

  if (url.startsWith("/")) {
    return jsonOk({ url });
  }

  if (storageDriver() === "oss" && !isOurStoredObject(url)) {
    return jsonError("无权签发该地址", 403);
  }

  const kind = /\.(mp4|webm|mov|m4v|avi)(\?|$)/i.test(url) ? "video" : "image";
  const signed = await resolveMediaUrl(url, { kind });
  return jsonOk({ url: signed });
}
