"use client";

import { useEffect, useState } from "react";
import { Button, Image, Space, Upload, message } from "antd";
import {
  DeleteOutlined,
  FolderOpenOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import AssetPickerModal, { type AssetItem } from "./AssetPickerModal";

type Props = {
  value?: string | null;
  onChange?: (url: string) => void;
  tip?: string;
  /** 是否显示「从素材库选择」，默认 true */
  allowLibrary?: boolean;
  /** 上传成功后清空预览区（素材库入库区用） */
  clearOnSuccess?: boolean;
};

async function resolvePreview(url: string) {
  if (!url || url.startsWith("/")) return url;
  try {
    const res = await fetch(`/api/media/access?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    if (res.ok && json.url) return json.url as string;
  } catch {
    // ignore
  }
  return url;
}

export default function ImageUploadField({
  value,
  onChange,
  tip,
  allowLibrary = true,
  clearOnSuccess = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const v = value?.trim() || "";
    if (!v) {
      setPreview("");
      return;
    }
    let cancelled = false;
    resolvePreview(v).then((url) => {
      if (!cancelled) setPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

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
      if (clearOnSuccess) {
        setPreview("");
      } else {
        setPreview(json.accessUrl || json.item.path);
      }
      message.success(clearOnSuccess ? "已入库素材库" : "已上传到素材库");
      onSuccess?.(json);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "上传失败");
      onError?.(err as Error);
    } finally {
      setUploading(false);
    }
  };

  function pick(asset: AssetItem) {
    onChange?.(asset.path);
    setPreview(asset.accessUrl || asset.path);
    message.success("已引用素材库文件");
  }

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
      <Space wrap>
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
        {allowLibrary && (
          <Button
            icon={<FolderOpenOutlined />}
            disabled={uploading}
            onClick={() => setPickerOpen(true)}
          >
            素材库
          </Button>
        )}
        {preview && (
          <Button icon={<DeleteOutlined />} onClick={() => onChange?.("")}>
            清除
          </Button>
        )}
      </Space>
      {tip && <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>{tip}</div>}
      <AssetPickerModal
        open={pickerOpen}
        kind="image"
        onClose={() => setPickerOpen(false)}
        onSelect={pick}
      />
    </div>
  );
}
