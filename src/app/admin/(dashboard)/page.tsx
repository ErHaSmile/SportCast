"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import dayjs from "dayjs";
import { PathBarChart, TrendLineChart } from "@/components/admin/DashboardCharts";

type Resources = {
  streams: number;
  schedules: number;
  assets: number;
  logs: number;
  liveOn: number;
  partners: number;
};

type Summary = {
  totalPv: number;
  todayPv: number;
  todayUv: number;
  last7Pv: number;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resources | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [last7Days, setLast7Days] = useState<
    { date: string; pv: number; uv: number }[]
  >([]);
  const [topPaths, setTopPaths] = useState<{ path: string; pv: number }[]>([]);
  const [latest, setLatest] = useState<
    { id: string; path: string; ip: string; createdAt: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/overview").then((r) => r.json()),
      fetch("/api/stats/summary").then((r) => r.json()),
    ])
      .then(([overview, stats]) => {
        setResources(overview.resources || null);
        setSummary(stats.summary || null);
        setLast7Days(stats.last7Days || []);
        setTopPaths(stats.topPaths || []);
        setLatest(stats.latest || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const resourceCards = [
    {
      label: "直播源",
      value: resources?.streams ?? 0,
      tip: `${resources?.liveOn ?? 0} 路启用`,
      href: "/admin/streams",
    },
    {
      label: "赛程",
      value: resources?.schedules ?? 0,
      tip: "赛程条目",
      href: "/admin/schedules",
    },
    {
      label: "素材库",
      value: resources?.assets ?? 0,
      tip: "图片 / 视频",
      href: "/admin/assets",
    },
    {
      label: "外链合作",
      value: resources?.partners ?? 0,
      tip: "已启用",
      href: "/admin/partners",
    },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>概览</h2>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
        内容概况与访客数据（UV 按 IP 近似去重，不含管理后台访问）。
      </Typography.Paragraph>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {resourceCards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              display: "block",
              padding: "16px 18px",
              border: "1px solid #eef0ee",
              borderRadius: 8,
              textDecoration: "none",
              color: "inherit",
              background: "#fafbfa",
            }}
          >
            <div style={{ color: "#888", fontSize: 13 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 2px" }}>
              {loading ? "—" : c.value}
            </div>
            <div style={{ color: "#0b6e4f", fontSize: 12 }}>{c.tip}</div>
          </Link>
        ))}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card loading={loading} size="small">
            <Statistic title="今日 PV" value={summary?.todayPv ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading} size="small">
            <Statistic title="今日 UV" value={summary?.todayUv ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading} size="small">
            <Statistic title="近 7 日 PV" value={summary?.last7Pv ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading} size="small">
            <Statistic title="累计 PV" value={summary?.totalPv ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="近 7 日访问趋势" loading={loading}>
            {last7Days.length ? (
              <TrendLineChart data={last7Days} />
            ) : (
              <div style={{ color: "#999", padding: 32, textAlign: "center" }}>
                暂无访问数据
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="近 7 日热门路径" loading={loading}>
            <PathBarChart data={topPaths} />
          </Card>
        </Col>
      </Row>

      <Card title="最近访问" style={{ marginTop: 16 }} loading={loading}>
        <Table
          rowKey="id"
          size="small"
          dataSource={latest}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: "时间",
              dataIndex: "createdAt",
              width: 170,
              render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
            },
            { title: "路径", dataIndex: "path" },
            { title: "IP", dataIndex: "ip", width: 140 },
          ]}
        />
      </Card>
    </div>
  );
}
