import { NextResponse } from "next/server";
import { getSession } from "./auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdminApi() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: jsonError("未登录", 401) };
  }
  return { session, error: null };
}
