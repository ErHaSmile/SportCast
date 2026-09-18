"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Space } from "antd";
import { PlayCircleOutlined, StopOutlined } from "@ant-design/icons";
import LivePlayer from "@/components/site/LivePlayer";

type Props = {
  type?: string;
  url?: string;
  /** 弹窗关闭时置 false，自动停止预览 */
  active?: boolean;
};

export default function StreamTestPreview({
  type = "HLS",
  url = "",
  active = true,
}: Props) {
  const [testing, setTesting] = useState(false);
  const trimmed = url.trim();
  const canTest = Boolean(trimmed);

  useEffect(() => {
    if (!active) setTesting(false);
  }, [active]);

  // 地址或类型变化时停止旧预览，避免播错源
  useEffect(() => {
    setTesting(false);
  }, [trimmed, type]);

  return (
    <div style={{ marginTop: -8, marginBottom: 16 }}>
      <Space wrap>
        {!testing ? (
          <Button
            type="default"
            icon={<PlayCircleOutlined />}
            disabled={!canTest}
            onClick={() => setTesting(true)}
          >
            测试源 / 预览
          </Button>
        ) : (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={() => setTesting(false)}
          >
            停止预览
          </Button>
        )}
        <span style={{ color: "#888", fontSize: 12 }}>
          用当前填写的地址试播，确认可播后再保存
        </span>
      </Space>

      {!canTest && (
        <Alert
          style={{ marginTop: 10 }}
          type="info"
          showIcon
          message="请先填写直播地址，再点击测试源"
        />
      )}

      {testing && canTest && (
        <div
          style={{
            marginTop: 12,
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            overflow: "hidden",
            background: "#0b1220",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              background: "#000",
            }}
          >
            <LivePlayer
              key={`${type}:${trimmed}`}
              type={type}
              url={trimmed}
              title="直播源预览"
              forceControls
            />
          </div>
          <div style={{ padding: "8px 12px", color: "#aaa", fontSize: 12, background: "#111" }}>
            预览中：{type === "H5" ? "H5 嵌入" : "HLS"} · {trimmed.slice(0, 80)}
            {trimmed.length > 80 ? "…" : ""}
            <div style={{ marginTop: 4, color: "#888" }}>
              若黑屏，多半是源失效/跨域；可换下方演示源地址再测
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
