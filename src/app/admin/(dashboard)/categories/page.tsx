"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Image,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ImageUploadField from "@/components/admin/ImageUploadField";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  badge: string;
  sort: number;
  enabled: boolean;
  scheduleCount?: number;
};

const defaults = {
  name: "",
  slug: "",
  description: "",
  coverUrl: "",
  badge: "",
  sort: 0,
  enabled: true,
};

export default function CategoriesPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/categories?all=1");
    const json = await res.json();
    setData(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue(defaults);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      coverUrl: row.coverUrl || "",
      description: row.description || "",
      badge: row.badge || "",
    });
    setOpen(true);
  }

  async function onFinish(values: Record<string, unknown>) {
    const res = await fetch(
      editing ? `/api/categories/${editing.id}` : "/api/categories",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      message.error(json.error || "保存失败");
      return;
    }
    message.success("已保存");
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
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
          <h2 style={{ margin: 0 }}>体育项目</h2>
          <p style={{ margin: "6px 0 0", color: "#888" }}>
            前台首页展示分类入口；赛程可绑定到项目，进入二级页浏览直播与回放。
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增项目
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
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
          { title: "名称", dataIndex: "name", width: 120 },
          { title: "标识", dataIndex: "slug", width: 120 },
          {
            title: "角标",
            dataIndex: "badge",
            width: 100,
            render: (v: string) => (v ? <Tag color="orange">{v}</Tag> : "—"),
          },
          {
            title: "赛程数",
            dataIndex: "scheduleCount",
            width: 90,
            render: (v: number) => v ?? 0,
          },
          {
            title: "状态",
            dataIndex: "enabled",
            width: 90,
            render: (v: boolean) => (
              <Tag color={v ? "green" : "default"}>{v ? "启用" : "停用"}</Tag>
            ),
          },
          { title: "排序", dataIndex: "sort", width: 70 },
          {
            title: "操作",
            width: 160,
            render: (_: unknown, row: Row) => (
              <Space>
                <Button size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Popconfirm title="确认删除？关联赛程将取消分类" onConfirm={() => remove(row.id)}>
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
        title={editing ? "编辑体育项目" : "新增体育项目"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={defaults} onFinish={onFinish}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如：攀岩" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="URL 标识"
            extra="留空则按名称生成；前台地址 /sport/标识"
          >
            <Input placeholder="climbing" />
          </Form.Item>
          <Form.Item name="badge" label="角标">
            <Input placeholder="如：热门 / 奥运 / LIVE" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={3} placeholder="二级页展示的项目介绍" />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面图">
            <ImageUploadField tip="建议 16:9，可点「素材库」引用" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
