import { prisma } from "@/lib/prisma";
import { jsonOk, requireAdminApi } from "@/lib/api";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const start7 = new Date(startToday);
  start7.setDate(start7.getDate() - 6);

  const [totalPv, todayPv, recent] = await Promise.all([
    prisma.pageVisit.count(),
    prisma.pageVisit.count({ where: { createdAt: { gte: startToday } } }),
    prisma.pageVisit.findMany({
      where: { createdAt: { gte: start7 } },
      select: { createdAt: true, ip: true, path: true },
    }),
  ]);

  const byDayMap = new Map<string, { pv: number; ips: Set<string> }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start7);
    d.setDate(start7.getDate() + i);
    byDayMap.set(dayKey(d), { pv: 0, ips: new Set() });
  }

  for (const row of recent) {
    const key = dayKey(row.createdAt);
    const bucket = byDayMap.get(key);
    if (!bucket) continue;
    bucket.pv += 1;
    if (row.ip) bucket.ips.add(row.ip);
  }

  const last7Days = Array.from(byDayMap.entries()).map(([date, v]) => ({
    date,
    pv: v.pv,
    uv: v.ips.size,
  }));

  const todayIps = new Set(
    recent
      .filter((r) => r.createdAt >= startToday)
      .map((r) => r.ip)
      .filter(Boolean),
  );

  const pathCount = new Map<string, number>();
  for (const row of recent) {
    pathCount.set(row.path, (pathCount.get(row.path) || 0) + 1);
  }
  const topPaths = Array.from(pathCount.entries())
    .map(([path, pv]) => ({ path, pv }))
    .sort((a, b) => b.pv - a.pv)
    .slice(0, 10);

  const latest = await prisma.pageVisit.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return jsonOk({
    summary: {
      totalPv,
      todayPv,
      todayUv: todayIps.size,
      last7Pv: recent.length,
    },
    last7Days,
    topPaths,
    latest,
  });
}
