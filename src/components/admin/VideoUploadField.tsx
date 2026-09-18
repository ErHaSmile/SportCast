"use client";

import { useEffect, useState } from "react";
import { Button, Progress, Space, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined, VideoCameraOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { VIDEO_MAX_BYTES, VIDEO_MAX_LABEL } from "@/lib/upload-limits";

type Props = {
  value?: string | null;
  onChange?: (url: string) => void;
  tip?: string;
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

function uploadWithProgress(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ item: { path: string }; accessUrl?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/assets/upload-video");
    xhr.timeout = 30 * 60 * 1000; // 30min
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      onProgress?.(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve(json);
          return;
        }
        reject(new Error(json.error || `上传失败(${xhr.status})`));
      } catch {
        reject(new Error(`上传失败(${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("网络错误，上传中断"));
    xhr.ontimeout = () => reject(new Error("上传超时，请检查网络后重试"));
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export default function VideoUploadField({ value, onChange, tip }: Props) {
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [preview, setPreview] = useState("");
  const fileName = (value || preview).split("?")[0].split("/").pop() || preview;

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
    const { file, onSuccess, onError, onProgress } = options;
    const raw = file as File;
    if (raw.size > VIDEO_MAX_BYTES) {
      message.error(`视频不能超过 ${VIDEO_MAX_LABEL}`);
      onError?.(new Error("too large"));
      return;
    }

    setUploading(true);
    setPercent(0);
    try {
      const json = await uploadWithProgress(raw, (p) => {
        setPercent(p);
        onProgress?.({ percent: p });
      });
      onChange?.(json.item.path);
      setPreview(json.accessUrl || json.item.path);
      message.success("视频上传成功");
      onSuccess?.(json);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "上传失败");
      onError?.(err as Error);
    } finally {
      setUploading(false);
      setPercent(0);
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
          <Button icon={<DeleteOutlined />} disabled={uploading} onClick={() => onChange?.("")}>
            清除
          </Button>
        )}
      </Space>
      {uploading && (
        <Progress percent={percent} size="small" style={{ marginTop: 8, maxWidth: 360 }} />
      )}
      {tip && <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>{tip}</div>}
    </div>
  );
}
