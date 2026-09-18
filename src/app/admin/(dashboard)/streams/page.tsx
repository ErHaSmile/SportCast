"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
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
import ImageUploadField from "@/components/admin/ImageUploadField";
import StreamTestPreview from "@/components/admin/StreamTestPreview";

type StreamRow = {
  id: string;
  name: string;
  type: string;
  url: string;
  status: string;
  sort: number;
  coverUrl: string | null;
};

const defaultValues = {
  type: "HLS",
  status: "OFF",
  sort: 0,
  coverUrl: "",
  name: "",
  url: "",
};

export default function StreamsPage() {
  const [data, setData] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StreamRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ON" | "OFF">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "HLS" | "H5">("all");
  const [form] = Form.useForm();
  const watchType = Form.useWatch("type", form) as string | undefined;
  const watchUrl = Form.useWatch("url", form) as string | undefined;

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return data.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (!q) return true;
      return `${row.name} ${row.url}`.toLowerCase().includes(q);
    });
  }, [data, keyword, statusFilter, typeFilter]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/streams");
    const json = await res.json();
    setData(json.items || []);
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

  function openEdit(row: StreamRow) {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({
      ...row,
      coverUrl: row.coverUrl || "",
    });
    setOpen(true);
  }

  async function onFinish(values: Record<string, unknown>) {
    const res = await fetch(editing ? `/api/streams/${editing.id}` : "/api/streams", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, coverUrl: (values.coverUrl as string) || "" }),
    });
    const json = await res.json();
    if (!res.ok) {
      message.error(json.error || "保存失败");
      return;
    }
    message.success("已保存");
    closeModal();
    load();
  }

  async function toggleStatus(row: StreamRow) {
    const status = row.status === "ON" ? "OFF" : "ON";
    const res = await fetch(`/api/streams/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      message.error("状态更新失败");
      return;
    }
    message.success(status === "ON" ? "已启用" : "已停用");
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/streams/${id}`, { method: "DELETE" });
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
        <h2 style={{ margin: 0 }}>直播源管理</h2>
        <Button type="primary" onClick={openCreate}>
          新增直播源
        </Button>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索名称 / 地址"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
          style={{ width: 260 }}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 120 }}
          options={[
            { value: "all", label: "全部类型" },
            { value: "HLS", label: "HLS" },
            { value: "H5", label: "H5" },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          options={[
            { value: "all", label: "全部状态" },
            { value: "ON", label: "已启用" },
            { value: "OFF", label: "已停用" },
          ]}
        />
        <Button
          onClick={() => {
            setKeyword("");
            setTypeFilter("all");
            setStatusFilter("all");
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
          { title: "名称", dataIndex: "name" },
          {
            title: "类型",
            dataIndex: "type",
            width: 90,
            render: (v: string) => <Tag>{v}</Tag>,
          },
          {
            title: "状态",
            dataIndex: "status",
            width: 100,
            render: (v: string, row: StreamRow) => (
              <Switch
                checkedChildren="启用"
                unCheckedChildren="停用"
                checked={v === "ON"}
                onChange={() => toggleStatus(row)}
              />
            ),
          },
          { title: "地址", dataIndex: "url", ellipsis: true },
          { title: "排序", dataIndex: "sort", width: 70 },
          {
            title: "操作",
            width: 160,
            render: (_: unknown, row: StreamRow) => (
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
        title={editing ? "编辑直播源" : "新增直播源"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        destroyOnHidden
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultValues}
          onFinish={onFinish}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "HLS", label: "HLS 流地址" },
                { value: "H5", label: "H5 嵌入地址" },
              ]}
            />
          </Form.Item>
          <Form.Item name="url" label="地址" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="https://...m3u8 或 H5 嵌入页地址" />
          </Form.Item>
          <StreamTestPreview type={watchType} url={watchUrl} active={open} />
          <Form.Item name="coverUrl" label="封面图">
            <ImageUploadField tip="直播封面 / 海报预览图" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "ON", label: "启用" },
                { value: "OFF", label: "停用" },
              ]}
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
