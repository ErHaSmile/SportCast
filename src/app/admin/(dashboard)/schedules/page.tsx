"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Image,
  message,
} from "antd";
import dayjs from "dayjs";
import ImageUploadField from "@/components/admin/ImageUploadField";
import VideoUploadField from "@/components/admin/VideoUploadField";
import { VIDEO_MAX_LABEL } from "@/lib/upload-limits";

type StreamOpt = { id: string; name: string };
type CategoryOpt = { id: string; name: string };
type Row = {
  id: string;
  title: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
  streamId: string | null;
  categoryId: string | null;
  replayUrl: string | null;
  detailUrl: string | null;
  coverUrl: string | null;
  summary?: string | null;
  content?: string | null;
  sort: number;
  isReplay: boolean;
  stream?: StreamOpt | null;
  category?: CategoryOpt | null;
};

const defaultValues = {
  isReplay: false,
  sort: 0,
  coverUrl: "",
  title: "",
  location: "",
  startAt: null,
  endAt: null,
  streamId: undefined,
  categoryId: undefined,
  replayUrl: "",
  detailUrl: "",
  summary: "",
  content: "",
};

export default function SchedulesPage() {
  const [data, setData] = useState<Row[]>([]);
  const [streams, setStreams] = useState<StreamOpt[]>([]);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "live" | "replay">("all");
  const [form] = Form.useForm();
  const isReplay = Form.useWatch("isReplay", form);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return data.filter((row) => {
      if (typeFilter === "live" && row.isReplay) return false;
      if (typeFilter === "replay" && !row.isReplay) return false;
      if (!q) return true;
      const hay = [
        row.title,
        row.location || "",
        row.stream?.name || "",
        row.replayUrl || "",
        row.summary || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, keyword, typeFilter]);

  async function load() {
    setLoading(true);
    const [sRes, stRes, cRes] = await Promise.all([
      fetch("/api/schedules"),
      fetch("/api/streams"),
      fetch("/api/categories?all=1"),
    ]);
    const sJson = await sRes.json();
    const stJson = await stRes.json();
    const cJson = await cRes.json();
    setData(sJson.items || []);
    setStreams((stJson.items || []).map((x: StreamOpt) => ({ id: x.id, name: x.name })));
    setCategories(
      (cJson.items || []).map((x: CategoryOpt) => ({ id: x.id, name: x.name })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function closeModal() {
    setOpen(false);
    setEditing(null);
    form.resetFields();
    form.setFieldsValue(defaultValues);
  }

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue(defaultValues);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({
      ...row,
      coverUrl: row.coverUrl || "",
      replayUrl: row.replayUrl || "",
      detailUrl: row.detailUrl || "",
      summary: row.summary || "",
      content: row.content || "",
      location: row.location || "",
      streamId: row.streamId || undefined,
      categoryId: row.categoryId || undefined,
      startAt: dayjs(row.startAt),
      endAt: row.endAt ? dayjs(row.endAt) : null,
    });
    setOpen(true);
  }

  async function onFinish(values: Record<string, unknown>) {
    const replay = Boolean(values.isReplay);
    const payload = {
      ...values,
      isReplay: replay,
      streamId: replay ? null : values.streamId || null,
      replayUrl: replay ? ((values.replayUrl as string) || "").trim() || null : null,
      coverUrl: (values.coverUrl as string) || "",
      startAt:
        values.startAt && typeof values.startAt === "object" && "toISOString" in values.startAt
          ? (values.startAt as { toISOString: () => string }).toISOString()
          : values.startAt,
      endAt:
        values.endAt && typeof values.endAt === "object" && "toISOString" in values.endAt
          ? (values.endAt as { toISOString: () => string }).toISOString()
          : values.endAt || null,
    };
    const res = await fetch(
      editing ? `/api/schedules/${editing.id}` : "/api/schedules",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      message.error(json.error || "保存失败");
      return;
    }
    message.success("已保存");
    closeModal();
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
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
        <h2 style={{ margin: 0 }}>赛程管理</h2>
        <Button type="primary" onClick={openCreate}>
          新增赛程
        </Button>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索标题 / 地点 / 直播源"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
          style={{ width: 280 }}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 140 }}
          options={[
            { value: "all", label: "全部类型" },
            { value: "live", label: "直播赛程" },
            { value: "replay", label: "往期回放" },
          ]}
        />
        <Button
          onClick={() => {
            setKeyword("");
            setTypeFilter("all");
          }}
        >
          重置
        </Button>
        <span style={{ color: "#888", fontSize: 13 }}>共 {filtered.length} 条</span>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        scroll={{ x: 1100 }}
        columns={[
          {
            title: "封面",
            dataIndex: "coverUrl",
            width: 80,
            render: (v: string | null) =>
              v ? (
                <Image src={v} alt="" width={48} height={48} style={{ objectFit: "cover" }} />
              ) : (
                "-"
              ),
          },
          {
            title: "类型",
            dataIndex: "isReplay",
            width: 90,
            render: (v: boolean) => (
              <Tag color={v ? "blue" : "green"}>{v ? "回放" : "直播赛程"}</Tag>
            ),
          },
          { title: "标题", dataIndex: "title", ellipsis: true },
          {
            title: "项目",
            width: 100,
            render: (_: unknown, row: Row) => row.category?.name || "—",
          },
          { title: "地点", dataIndex: "location", width: 140 },
          {
            title: "开始时间",
            dataIndex: "startAt",
            width: 160,
            render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
          },
          {
            title: "直播源 / 回放",
            width: 140,
            ellipsis: true,
            render: (_: unknown, row: Row) => {
              if (row.isReplay) {
                if (!row.replayUrl) return "-";
                const name = row.replayUrl.split("/").pop() || row.replayUrl;
                return name.length > 18 ? `${name.slice(0, 16)}…` : name;
              }
              return row.stream?.name || "-";
            },
          },
          { title: "排序", dataIndex: "sort", width: 70 },
          {
            title: "操作",
            width: 160,
            fixed: "right",
            render: (_: unknown, row: Row) => (
              <Space>
                <Button size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm title="确认删除？" onConfirm={() => remove(row.id)}>
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
        title={editing ? "编辑赛程" : "新增赛程"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        width={640}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultValues}
          onFinish={onFinish}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="体育项目" extra="前台分类页会按项目聚合展示">
            <Select
              allowClear
              placeholder="选择体育项目"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="isReplay" label="赛程类型" valuePropName="checked">
            <Switch
              checkedChildren="回放"
              unCheckedChildren="直播"
              onChange={(checked) => {
                if (checked) {
                  form.setFieldValue("streamId", undefined);
                } else {
                  form.setFieldValue("replayUrl", "");
                }
              }}
            />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input />
          </Form.Item>
          <Form.Item name="startAt" label="开始时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endAt" label="结束时间">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          {!isReplay && (
            <Form.Item
              name="streamId"
              label="绑定直播源"
              extra="直播赛程请选择已配置的直播源，前台将按该源播放"
            >
              <Select
                allowClear
                placeholder="选择直播源"
                options={streams.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
          )}

          {isReplay && (
            <Form.Item
              name="replayUrl"
              label="回放视频"
              rules={[{ required: true, message: "请上传回放视频" }]}
              extra="上传 MP4 / WEBM / MOV，前台回放页将直接播放该视频"
            >
              <VideoUploadField tip={`建议 1080p MP4，单文件不超过 ${VIDEO_MAX_LABEL}；也可点「素材库」引用已上传视频`} />
            </Form.Item>
          )}

          <Form.Item name="detailUrl" label="详情 / H5 地址">
            <Input />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面图">
            <ImageUploadField tip="赛程 / 回放封面，可点「素材库」引用" />
          </Form.Item>
          {isReplay && (
            <>
              <Form.Item name="summary" label="摘要（录播列表导语）">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="content" label="图文正文（录播详情）">
                <Input.TextArea
                  rows={5}
                  placeholder="支持纯图文；已上传视频时详情页会同时显示播放器"
                />
              </Form.Item>
            </>
          )}
          <Form.Item name="sort" label="排序">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
