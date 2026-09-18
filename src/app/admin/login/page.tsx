"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: { username: string; password: string }) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "登录失败");
        return;
      }
      message.success("登录成功");
      router.replace(searchParams.get("from") || "/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ width: 380, boxShadow: "0 8px 32px rgba(0,0,0,.08)" }}>
      <Typography.Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
        赛播云
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ textAlign: "center" }}>
        赛事直播录播管理系统
      </Typography.Paragraph>
      <Form layout="vertical" onFinish={onFinish} initialValues={{ username: "admin" }}>
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: "请输入用户名" }]}
        >
          <Input size="large" autoComplete="username" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          登录
        </Button>
      </Form>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={zhCN}
        theme={{ token: { colorPrimary: "#0b6e4f", borderRadius: 6 } }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(160deg, #e8f5ef 0%, #f7faf8 45%, #eef2f0 100%)",
          }}
        >
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </ConfigProvider>
    </AntdRegistry>
  );
}
