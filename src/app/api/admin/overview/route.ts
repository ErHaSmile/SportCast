import { prisma } from "@/lib/prisma";
import { jsonOk, requireAdminApi } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const [streams, schedules, assets, logs, liveOn, partners] = await Promise.all([
    prisma.stream.count(),
    prisma.schedule.count(),
    prisma.asset.count(),
    prisma.operationLog.count(),
    prisma.stream.count({ where: { status: "ON" } }),
    prisma.partner.count({ where: { enabled: true } }),
  ]);

  return jsonOk({
    resources: { streams, schedules, assets, logs, liveOn, partners },
  });
}
