import { prisma } from "@/lib/prisma";
import { jsonOk, requireAdminApi } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const items = await prisma.operationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return jsonOk({ items });
}
