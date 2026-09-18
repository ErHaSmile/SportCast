import { NextRequest } from "next/server";
import { createSession, destroySession, getSession, verifyLogin } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("未登录", 401);
  return jsonOk({ user: session });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  const username = body?.username?.trim();
  const password = body?.password;
  if (!username || !password) {
    return jsonError("请输入用户名和密码");
  }

  const user = await verifyLogin(username, password);
  if (!user) {
    return jsonError("用户名或密码错误", 401);
  }

  await createSession(user);
  return jsonOk({ user });
}

export async function DELETE() {
  await destroySession();
  return jsonOk({ ok: true });
}
