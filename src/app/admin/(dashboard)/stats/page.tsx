"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import dayjs from "dayjs";

type Summary = {
  totalPv: number;
  todayPv: number;
  todayUv: number;
  last7Pv: number;
};

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [last7Days, setLast7Days] = useState<
    { date: string; pv: number; uv: number }[]
  >([]);
  const [topPaths, setTopPaths] = useState<{ path: string; pv: number }[]>([]);
  const [latest, setLatest] = useState<
    { id: string; path: string; ip: string; createdAt: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/stats/summary")
      .then((r) => r.json())
      .then((json) => {
        setSummary(json.summary || null);
        setLast7Days(json.last7Days || []);
        setTopPaths(json.topPaths || []);
        setLatest(json.latest || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>访客统计</h2>
      <Typography.Paragraph type="secondary">
        统计门户页面访问量（不含管理后台）。UV 按 IP 近似去重。
      </Typography.Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="今日 PV" value={summary?.todayPv ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="今日 UV" value={summary?.todayUv ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="近 7 日 PV" value={summary?.last7Pv ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="累计 PV" value={summary?.totalPv ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="近 7 日趋势" loading={loading}>
            <Table
              rowKey="date"
              pagination={false}
              size="small"
              dataSource={last7Days}
              columns={[
                { title: "日期", dataIndex: "date" },
                { title: "PV", dataIndex: "pv", width: 80 },
                { title: "UV", dataIndex: "uv", width: 80 },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="近 7 日热门路径" loading={loading}>
            <Table
              rowKey="path"
              pagination={false}
              size="small"
              dataSource={topPaths}
              columns={[
                { title: "路径", dataIndex: "path" },
                { title: "PV", dataIndex: "pv", width: 80 },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近访问" style={{ marginTop: 16 }} loading={loading}>
        <Table
          rowKey="id"
          size="small"
          dataSource={latest}
          pagination={{ pageSize: 10 }}
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
