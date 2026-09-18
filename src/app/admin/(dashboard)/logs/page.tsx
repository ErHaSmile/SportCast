"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";

type Row = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  before: string | null;
  after: string | null;
  operator: string;
  createdAt: string;
};

export default function LogsPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then((json) => {
        setData(json.items || []);
        setLoading(false);
      });
  }, []);

  const targetOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.targetType).filter(Boolean));
    return [
      { value: "all", label: "全部对象" },
      ...Array.from(set).map((v) => ({ value: v, label: v })),
    ];
  }, [data]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return data.filter((row) => {
      if (targetFilter !== "all" && row.targetType !== targetFilter) return false;
      if (!q) return true;
      return `${row.action} ${row.operator} ${row.targetType} ${row.targetId || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [data, keyword, targetFilter]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>操作日志</h2>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索动作 / 操作人 / 对象"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
          style={{ width: 280 }}
        />
        <Select
          value={targetFilter}
          onChange={setTargetFilter}
          style={{ width: 160 }}
          options={targetOptions}
        />
        <span style={{ color: "#888", fontSize: 13 }}>共 {filtered.length} 条</span>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        expandable={{
          expandedRowRender: (row) => (
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12 }}>
              {JSON.stringify(
                {
                  before: row.before ? JSON.parse(row.before) : null,
                  after: row.after ? JSON.parse(row.after) : null,
                },
                null,
                2,
              )}
            </pre>
          ),
        }}
        columns={[
          {
            title: "时间",
            dataIndex: "createdAt",
            width: 170,
            render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
          },
          { title: "操作人", dataIndex: "operator", width: 100 },
          {
            title: "动作",
            dataIndex: "action",
            width: 160,
            render: (v: string) => <Tag>{v}</Tag>,
          },
          { title: "对象", dataIndex: "targetType", width: 110 },
          { title: "对象 ID", dataIndex: "targetId", ellipsis: true },
        ]}
      />
    </div>
  );
}
