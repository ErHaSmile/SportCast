import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [streams, schedules, assets, logs, liveOn] = await Promise.all([
    prisma.stream.count(),
    prisma.schedule.count(),
    prisma.asset.count(),
    prisma.operationLog.count(),
    prisma.stream.count({ where: { status: "ON" } }),
  ]);

  const cards = [
    { label: "直播源", value: `${streams}`, tip: `${liveOn} 路启用`, href: "/admin/streams" },
    { label: "赛程", value: `${schedules}`, tip: "赛程条目", href: "/admin/schedules" },
    { label: "素材库", value: `${assets}`, tip: "图片 / 视频统一管理", href: "/admin/assets" },
    { label: "操作日志", value: `${logs}`, tip: "变更记录", href: "/admin/logs" },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>概览</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        赛播云后台已就绪。可从左侧进入各管理模块继续完善内容。
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              display: "block",
              padding: 20,
              border: "1px solid #eef0ee",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
              background: "#fafbfa",
            }}
          >
            <div style={{ color: "#888", fontSize: 13 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 4px" }}>{c.value}</div>
            <div style={{ color: "#0b6e4f", fontSize: 12 }}>{c.tip}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
