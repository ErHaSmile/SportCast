"use client";

import { useCallback, useEffect, useState } from "react";
import { Empty, Image, Input, Modal, Radio, Space, Spin, message } from "antd";

export type AssetItem = {
  id: string;
  name: string;
  alias?: string;
  path: string;
  accessUrl?: string;
  mime: string;
  size: number;
  createdAt: string;
};

type Props = {
  open: boolean;
  kind?: "image" | "video" | "all";
  onClose: () => void;
  onSelect: (asset: AssetItem) => void;
};

export default function AssetPickerModal({
  open,
  kind = "all",
  onClose,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AssetItem[]>([]);
  const [q, setQ] = useState("");
  const [filterKind, setFilterKind] = useState<"image" | "video" | "all">(kind);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("kind", filterKind);
      const res = await fetch(`/api/assets?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setItems(json.items || []);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [q, filterKind]);

  useEffect(() => {
    if (!open) return;
    setFilterKind(kind);
    setQ("");
  }, [open, kind]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [open, load]);

  return (
    <Modal
      title="从素材库选择"
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnHidden
    >
      <Space wrap style={{ marginBottom: 12, width: "100%" }}>
        <Input.Search
          allowClear
          placeholder="搜索名称 / 别名 / 路径"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={setQ}
          style={{ width: 280 }}
        />
        {kind === "all" && (
          <Radio.Group
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            optionType="button"
            options={[
              { label: "全部", value: "all" },
              { label: "图片", value: "image" },
              { label: "视频", value: "video" },
            ]}
          />
        )}
        <span style={{ color: "#888", fontSize: 13 }}>{items.length} 个素材</span>
      </Space>

      <Spin spinning={loading}>
        {!items.length ? (
          <Empty description="暂无匹配素材，请先到「素材」页上传" />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
              maxHeight: 460,
              overflow: "auto",
              paddingBottom: 8,
            }}
          >
            {items.map((item) => {
              const src = item.accessUrl || item.path;
              const isVideo = item.mime.startsWith("video/");
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    padding: 8,
                    background: "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 96,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#f5f5f5",
                      marginBottom: 8,
                    }}
                  >
                    {isVideo ? (
                      <video
                        src={src}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Image
                        src={src}
                        alt=""
                        preview={false}
                        width="100%"
                        height={96}
                        style={{ objectFit: "contain" }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  {item.alias ? (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#0b6e4f",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.alias}
                    >
                      别名：{item.alias}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#aaa" }}>
                      {isVideo ? "视频" : "图片"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Spin>
    </Modal>
  );
}
