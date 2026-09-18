"use client";

import { useEffect, useState } from "react";
import { Button, Collapse, Form, Input, Spin, message } from "antd";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function SiteSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        form.setFieldsValue(json.item || {});
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form]);

  async function submit() {
    const values = await form.validateFields();
    setSaving(true);
    const res = await fetch("/api/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      message.error("保存失败");
      return;
    }
    message.success("站点配置已保存");
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>站点配置</h2>
      <p style={{ color: "#888", marginBottom: 20 }}>
        只保留前台会用到的配置。有直播信号时，封面口号/单位文案不会盖在画面上，已放进「备用」分组。
      </p>
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" disabled={loading} style={{ maxWidth: 820 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>门户常显</h3>
          <Form.Item
            name="eventTitle"
            label="页面标题"
            rules={[{ required: true }]}
            extra="播放器上方的赛事标题"
          >
            <Input placeholder="例如：2026年中国攀岩联赛（贵州贵阳站）" />
          </Form.Item>
          <Form.Item
            name="bannerTitle"
            label="顶部横幅大标题"
            extra="页顶大横幅主文案；留空则沿用页面标题"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="eventSubtitle"
            label="横幅副标题"
            extra="大标题上方的小字，如「中国攀岩联赛 · 官方直播」"
          >
            <Input />
          </Form.Item>
          <Form.Item name="eventDateText" label="日期文案" extra="标题下方，如 2026年8月4日-5日">
            <Input />
          </Form.Item>
          <Form.Item name="sourceText" label="来源文案" extra="与日期同行显示，如 中国登山协会官网">
            <Input />
          </Form.Item>

          <Collapse
            style={{ margin: "8px 0 20px" }}
            items={[
              {
                key: "poster",
                label: "无直播信号时的封面备用（平时有直播时不显示）",
                children: (
                  <>
                    <p style={{ color: "#888", marginTop: 0 }}>
                      仅当没有可用直播源时，播放器区域会显示海报图与单位文案。
                    </p>
                    <Form.Item name="slogan" label="海报口号">
                      <Input />
                    </Form.Item>
                    <Form.Item name="heroImageUrl" label="赛事海报图">
                      <ImageUploadField tip="建议 16:9；可点「素材库」引用已上传海报" />
                    </Form.Item>
                    <Form.Item name="locationText" label="地点文案（海报底部）">
                      <Input />
                    </Form.Item>
                    <Form.Item name="hostUnits" label="主办单位">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="organizeUnits" label="承办单位">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="coOrganizeUnits" label="协办单位">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="supportUnits" label="支持单位">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />

          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>页脚</h3>
          <Form.Item
            name="footerLinks"
            label="页脚导航文字"
            extra="用 | 分隔，仅展示文案（当前不做真实跳转）"
          >
            <Input placeholder="关于我们|隐私保护|联系我们" />
          </Form.Item>
          <Form.Item name="footerCopyright" label="版权信息">
            <Input />
          </Form.Item>
          <Form.Item name="footerIcp" label="备案信息">
            <Input />
          </Form.Item>
          <Form.Item name="footerContact" label="联系方式">
            <Input />
          </Form.Item>

          <Button type="primary" loading={saving} onClick={submit}>
            保存配置
          </Button>
        </Form>
      </Spin>
    </div>
  );
}
