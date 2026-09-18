"use client";

import { useState } from "react";
import { Button, Space, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined, VideoCameraOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

type Props = {
  value?: string | null;
  onChange?: (url: string) => void;
  tip?: string;
};

export default function VideoUploadField({ value, onChange, tip }: Props) {
  const [uploading, setUploading] = useState(false);
  const preview = value?.trim() || "";
  const fileName = preview.split("/").pop() || preview;

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;
    const raw = file as File;
    if (raw.size > 200 * 1024 * 1024) {
      message.error("视频不能超过 200MB");
      onError?.(new Error("too large"));
      return;
    }

    const formData = new FormData();
    formData.append("file", raw);
    setUploading(true);
    try {
      const res = await fetch("/api/assets/upload-video", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "上传失败");
      onChange?.(json.item.path);
      message.success("视频上传成功");
      onSuccess?.(json);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "上传失败");
      onError?.(err as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {preview ? (
        <div
          style={{
            marginBottom: 10,
            borderRadius: 8,
            overflow: "hidden",
            background: "#0b1220",
            border: "1px solid #f0f0f0",
          }}
        >
          <video
            key={preview}
            src={preview}
            controls
            playsInline
            style={{ width: "100%", maxHeight: 240, display: "block", background: "#000" }}
          />
          <div style={{ padding: "8px 10px", fontSize: 12, color: "#666" }}>
            {fileName}
          </div>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: 140,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px dashed #d9d9d9",
            display: "grid",
            placeItems: "center",
            color: "#999",
            fontSize: 13,
            background: "#fafafa",
            gap: 6,
          }}
        >
          <VideoCameraOutlined style={{ fontSize: 28 }} />
          <span>尚未上传回放视频</span>
        </div>
      )}
      <Space>
        <Upload
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          showUploadList={false}
          customRequest={customRequest}
          disabled={uploading}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {preview ? "重新上传视频" : "上传回放视频"}
          </Button>
        </Upload>
        {preview && (
          <Button icon={<DeleteOutlined />} onClick={() => onChange?.("")}>
            清除
          </Button>
        )}
      </Space>
      {tip && <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>{tip}</div>}
    </div>
  );
}
