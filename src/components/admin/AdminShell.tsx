"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Typography,
  theme,
  Spin,
  message,
} from "antd";
import {
  VideoCameraOutlined,
  CalendarOutlined,
  PictureOutlined,
  FileSearchOutlined,
  EyeOutlined,
  DashboardOutlined,
  LogoutOutlined,
  LinkOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import zhCN from "antd/locale/zh_CN";
import { ConfigProvider } from "antd";

const { Header, Sider, Content } = Layout;

const items = [
  { key: "/admin", icon: <DashboardOutlined />, label: "概览" },
  { key: "/admin/streams", icon: <VideoCameraOutlined />, label: "直播源" },
  { key: "/admin/schedules", icon: <CalendarOutlined />, label: "赛程" },
  { key: "/admin/partners", icon: <LinkOutlined />, label: "外链合作" },
  { key: "/admin/site", icon: <SettingOutlined />, label: "站点配置" },
  { key: "/admin/assets", icon: <PictureOutlined />, label: "素材库" },
  { key: "/admin/logs", icon: <FileSearchOutlined />, label: "操作日志" },
  { key: "/admin/preview", icon: <EyeOutlined />, label: "预览" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    fetch("/api/auth")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        setUsername(data.user?.username || "");
        setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  const selected =
    items.find((i) => i.key !== "/admin" && pathname.startsWith(i.key))?.key ||
    "/admin";

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    message.success("已退出");
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <AntdRegistry>
        <ConfigProvider locale={zhCN}>
          <div
            style={{
              minHeight: "100vh",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Spin size="large" description="加载中..." />
          </div>
        </ConfigProvider>
      </AntdRegistry>
    );
  }

  return (
    <AntdRegistry>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: "#0b6e4f",
            borderRadius: 6,
          },
        }}
      >
        <Layout style={{ minHeight: "100vh" }}>
          <Sider breakpoint="lg" collapsedWidth={64}>
            <div
              style={{
                height: 56,
                margin: 12,
                color: "#fff",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
              }}
            >
              赛播云
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selected]}
              items={items}
              onClick={({ key }) => router.push(key)}
            />
          </Sider>
          <Layout>
            <Header
              style={{
                background: colorBgContainer,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingInline: 24,
              }}
            >
              <Typography.Text type="secondary">赛事直播录播管理</Typography.Text>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Typography.Text>{username}</Typography.Text>
                <Button icon={<LogoutOutlined />} onClick={logout}>
                  退出
                </Button>
              </div>
            </Header>
            <Content style={{ margin: 24 }}>
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                }}
              >
                {children}
              </div>
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </AntdRegistry>
  );
}
