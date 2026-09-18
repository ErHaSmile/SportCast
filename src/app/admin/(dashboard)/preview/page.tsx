export default function PreviewPage() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>预览</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        占位页：嵌入前台专题页效果预览。
      </p>
      <iframe
        title="site-preview"
        src="/"
        style={{
          width: "100%",
          height: "70vh",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      />
    </div>
  );
}
