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

type Row = {
  id: string;
  name: string;
  url: string | null;
  group: string;
  logoUrl: string | null;
  sort: number;
  enabled: boolean;
};

const groupLabel: Record<string, string> = {
  HEADER: "顶部外链",
  PARTNER: "合作单位",
  SPONSOR: "海报赞助",
};

const defaultValues = {
  group: "PARTNER",
  enabled: true,
  sort: 0,
  logoUrl: "",
  name: "",
  url: "",
};

export default function PartnersPage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [keyword, setKeyword] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all" | "HEADER" | "PARTNER" | "SPONSOR">(
    "all",
  );
  const [enabledFilter, setEnabledFilter] = useState<"all" | "yes" | "no">("all");
  const [form] = Form.useForm();

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return data.filter((row) => {
      if (groupFilter !== "all" && row.group !== groupFilter) return false;
      if (enabledFilter === "yes" && !row.enabled) return false;
      if (enabledFilter === "no" && row.enabled) return false;
      if (!q) return true;
      return `${row.name} ${row.url || ""}`.toLowerCase().includes(q);
    });
  }, [data, keyword, groupFilter, enabledFilter]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/partners");
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

  function openEdit(row: Row) {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({
      ...row,
      logoUrl: row.logoUrl || "",
      url: row.url || "",
    });
    setOpen(true);
  }

  async function onFinish(values: Record<string, unknown>) {
    const res = await fetch(editing ? `/api/partners/${editing.id}` : "/api/partners", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        logoUrl: (values.logoUrl as string) || "",
        url: (values.url as string) || "",
      }),
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

  async function remove(id: string) {
    const res = await fetch(`/api/partners/${id}`, { method: "DELETE" });
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
          <h2 style={{ margin: 0 }}>外链 / 合作单位</h2>
          <p style={{ margin: "6px 0 0", color: "#888" }}>
            顶部外链、合作单位、海报赞助 Logo 均可在此维护
          </p>
        </div>
        <Button type="primary" onClick={openCreate}>
          新增
        </Button>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜索名称 / 链接"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={setKeyword}
          style={{ width: 240 }}
        />
        <Select
          value={groupFilter}
          onChange={setGroupFilter}
          style={{ width: 140 }}
          options={[
            { value: "all", label: "全部分组" },
            { value: "HEADER", label: "顶部外链" },
            { value: "PARTNER", label: "合作单位" },
            { value: "SPONSOR", label: "海报赞助" },
          ]}
        />
        <Select
          value={enabledFilter}
          onChange={setEnabledFilter}
          style={{ width: 120 }}
          options={[
            { value: "all", label: "全部状态" },
            { value: "yes", label: "已启用" },
            { value: "no", label: "已停用" },
          ]}
        />
        <Button
          onClick={() => {
            setKeyword("");
            setGroupFilter("all");
            setEnabledFilter("all");
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
            title: "Logo",
            dataIndex: "logoUrl",
            width: 80,
            render: (v: string | null) =>
              v ? (
                <Image src={v} alt="" width={40} height={40} style={{ objectFit: "contain" }} />
              ) : (
                "-"
              ),
          },
          {
            title: "分组",
            dataIndex: "group",
            width: 110,
            render: (v: string) => <Tag>{groupLabel[v] || v}</Tag>,
          },
          { title: "名称", dataIndex: "name" },
          { title: "链接", dataIndex: "url", ellipsis: true },
          { title: "排序", dataIndex: "sort", width: 70 },
          {
            title: "启用",
            dataIndex: "enabled",
            width: 80,
            render: (v: boolean) => (v ? "是" : "否"),
          },
          {
            title: "操作",
            width: 160,
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
        title={editing ? "编辑" : "新增"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        destroyOnHidden
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
          <Form.Item name="group" label="分组" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "HEADER", label: "顶部外链" },
                { value: "PARTNER", label: "合作单位" },
                { value: "SPONSOR", label: "海报赞助" },
              ]}
            />
          </Form.Item>
          <Form.Item name="url" label="跳转链接">
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item name="logoUrl" label="Logo 图片">
            <ImageUploadField tip="建议正方形透明底 PNG" />
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
