import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { path?: string } | null;
  const pathName = body?.path?.trim() || "/";

  // skip admin/api noise if somehow called
  if (pathName.startsWith("/admin") || pathName.startsWith("/api")) {
    return jsonOk({ ok: true, skipped: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  await prisma.pageVisit.create({
    data: {
      path: pathName.slice(0, 200),
      ip: ip.slice(0, 64),
      ua: ua.slice(0, 300),
      referer: referer.slice(0, 300),
    },
  });

  return jsonOk({ ok: true });
}
