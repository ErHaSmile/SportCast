"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { EditOutlined, PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import ImageUploadField from "@/components/admin/ImageUploadField";
import VideoUploadField from "@/components/admin/VideoUploadField";
import { VIDEO_MAX_LABEL } from "@/lib/upload-limits";

type Row = {
  id: string;
  name: string;
  alias: string;
  path: string;
  accessUrl?: string;
  mime: string;
  size: number;
  createdAt: string;
};

export default function AssetsPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video">("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [previewVideo, setPreviewVideo] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      params.set("kind", kind);
      const res = await fetch(`/api/assets?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setData(json.items || []);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [keyword, kind]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function remove(id: string) {
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      message.error("删除失败");
      return;
    }
    message.success("已删除");
    load();
  }

  function openEdit(row: Row) {
    setEditing(row);
    form.setFieldsValue({ name: row.name, alias: row.alias || "" });
    setEditOpen(true);
  }

  async function saveMeta() {
    if (!editing) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      message.success("已保存");
      setEditOpen(false);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>素材管理</h2>
          <p style={{ margin: "6px 0 0", color: "#888" }}>
            站点图片 / 视频统一入库。赛程、直播源、合作单位、站点配置均可点「素材库」引用，避免重复上传。
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>
          刷新
        </Button>
      </Space>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: 16,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 10 }}>上传图片</div>
          <ImageUploadField
            allowLibrary={false}
            clearOnSuccess
            tip="JPG / PNG / WEBP / GIF，单文件不超过 5MB。上传后可编辑别名便于搜索。"
            onChange={() => load()}
          />
        </div>
        <div
          style={{
            padding: 16,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 10 }}>上传视频</div>
          <VideoUploadField
            allowLibrary={false}
            clearOnSuccess
            tip={`MP4 / WEBM / MOV，单文件不超过 ${VIDEO_MAX_LABEL}。建议先在此入库，赛程里从素材库引用。`}
            onChange={() => load()}
          />
        </div>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索名称 / 别名 / 路径"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
          style={{ width: 300 }}
        />
        <Radio.Group
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          optionType="button"
          options={[
            { label: "全部", value: "all" },
            { label: "图片", value: "image" },
            { label: "视频", value: "video" },
          ]}
        />
        <span style={{ color: "#888", fontSize: 13 }}>共 {data.length} 条</span>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        columns={[
          {
            title: "预览",
            dataIndex: "path",
            width: 110,
            render: (_: string, row: Row) => {
              const src = row.accessUrl || row.path;
              if (row.mime.startsWith("video/")) {
                return (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(row)}
                    title="点击预览视频"
                    style={{
                      position: "relative",
                      width: 72,
                      height: 72,
                      padding: 0,
                      border: "none",
                      borderRadius: 6,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "#0b1220",
                    }}
                  >
                    <video
                      src={src}
                      muted
                      preload="metadata"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(0,0,0,.35)",
                        color: "#fff",
                        fontSize: 28,
                      }}
                    >
                      <PlayCircleOutlined />
                    </span>
                  </button>
                );
              }
              return (
                <Image src={src} alt="" width={64} height={64} style={{ objectFit: "contain" }} />
              );
            },
          },
          {
            title: "名称",
            dataIndex: "name",
            ellipsis: true,
          },
          {
            title: "别名",
            dataIndex: "alias",
            width: 160,
            ellipsis: true,
            render: (v: string) =>
              v ? <Tag color="green">{v}</Tag> : <span style={{ color: "#bbb" }}>—</span>,
          },
          {
            title: "类型",
            dataIndex: "mime",
            width: 90,
            render: (mime: string) =>
              mime.startsWith("video/") ? (
                <Tag>视频</Tag>
              ) : (
                <Tag color="blue">图片</Tag>
              ),
          },
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
            width: 200,
            render: (_: unknown, row: Row) => (
              <Space>
                {row.mime.startsWith("video/") && (
                  <Button size="small" onClick={() => setPreviewVideo(row)}>
                    预览
                  </Button>
                )}
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
                  别名
                </Button>
                <Popconfirm title="确认删除该素材？" onConfirm={() => remove(row.id)}>
                  <Button size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="编辑素材"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={saveMeta}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="原始文件名或展示名" />
          </Form.Item>
          <Form.Item
            label="别名"
            name="alias"
            extra="用于搜索，例如：决赛海报、开幕式回放"
          >
            <Input placeholder="可选，便于在素材库里快速找到" allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={previewVideo?.alias || previewVideo?.name || "视频预览"}
        open={Boolean(previewVideo)}
        onCancel={() => setPreviewVideo(null)}
        footer={null}
        width={840}
        destroyOnHidden
      >
        {previewVideo && (
          <video
            key={previewVideo.id}
            src={previewVideo.accessUrl || previewVideo.path}
            controls
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxHeight: "70vh",
              background: "#000",
              borderRadius: 8,
              display: "block",
            }}
          />
        )}
      </Modal>
    </div>
  );
}
