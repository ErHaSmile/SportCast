"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Image, Input, Popconfirm, Space, Table, message } from "antd";
import ImageUploadField from "@/components/admin/ImageUploadField";

type Row = {
  id: string;
  name: string;
  path: string;
  mime: string;
  size: number;
  createdAt: string;
};

export default function AssetsPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      `${row.name} ${row.path} ${row.mime}`.toLowerCase().includes(q),
    );
  }, [data, keyword]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/assets");
    const json = await res.json();
    setData(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      message.error("删除失败");
      return;
    }
    message.success("已删除");
    load();
  }

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>素材管理</h2>
          <p style={{ margin: "6px 0 0", color: "#888" }}>
            上传海报、封面、Logo，可在合作单位 / 站点配置中引用
          </p>
        </div>
      </Space>

      <div
        style={{
          padding: 16,
          marginBottom: 16,
          background: "#fafafa",
          borderRadius: 8,
          border: "1px solid #f0f0f0",
        }}
      >
        <ImageUploadField
          tip="支持 JPG / PNG / WEBP / GIF，单文件不超过 5MB"
          onChange={() => load()}
        />
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索名称 / 路径"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
          style={{ width: 280 }}
        />
        <span style={{ color: "#888", fontSize: 13 }}>共 {filtered.length} 条</span>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={[
          {
            title: "预览",
            dataIndex: "path",
            width: 100,
            render: (v: string, row: Row) =>
              row.mime.startsWith("video/") ? (
                <video
                  src={v}
                  style={{ width: 64, height: 64, objectFit: "cover", background: "#000" }}
                />
              ) : (
                <Image src={v} alt="" width={64} height={64} style={{ objectFit: "contain" }} />
              ),
          },
          { title: "名称", dataIndex: "name", ellipsis: true },
          { title: "路径", dataIndex: "path", ellipsis: true },
          {
            title: "大小",
            dataIndex: "size",
            width: 100,
            render: (v: number) =>
              v >= 1024 * 1024
                ? `${(v / (1024 * 1024)).toFixed(1)} MB`
                : `${(v / 1024).toFixed(1)} KB`,
          },
          {
            title: "操作",
            width: 100,
            render: (_: unknown, row: Row) => (
              <Popconfirm title="确认删除该素材？" onConfirm={() => remove(row.id)}>
                <Button size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  );
}
