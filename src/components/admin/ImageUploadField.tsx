"use client";

import { useState } from "react";
import { Button, Image, Space, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

type Props = {
  value?: string | null;
  onChange?: (url: string) => void;
  tip?: string;
};

export default function ImageUploadField({ value, onChange, tip }: Props) {
  const [uploading, setUploading] = useState(false);
  const preview = value?.trim() || "";

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file as File);
    setUploading(true);
    try {
      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "上传失败");
      onChange?.(json.item.path);
      message.success("上传成功");
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
        <div style={{ marginBottom: 10 }}>
          <Image
            key={preview}
            src={preview}
            alt="预览"
            width={140}
            height={140}
            style={{ objectFit: "contain", background: "#f5f5f5", borderRadius: 8 }}
          />
        </div>
      ) : (
        <div
          style={{
            width: 140,
            height: 140,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px dashed #d9d9d9",
            display: "grid",
            placeItems: "center",
            color: "#999",
            fontSize: 12,
            background: "#fafafa",
          }}
        >
          暂无图片
        </div>
      )}
      <Space>
        <Upload
          accept="image/png,image/jpeg,image/webp,image/gif"
          showUploadList={false}
          customRequest={customRequest}
          disabled={uploading}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {preview ? "重新上传" : "上传图片"}
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
