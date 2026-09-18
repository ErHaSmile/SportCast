"use client";

/** 近 7 日 PV / UV 折线图（纯 SVG，无额外依赖） */
export function TrendLineChart({
  data,
}: {
  data: { date: string; pv: number; uv: number }[];
}) {
  const w = 640;
  const h = 220;
  const pad = { t: 16, r: 16, b: 36, l: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxY = Math.max(1, ...data.map((d) => Math.max(d.pv, d.uv)));

  function xAt(i: number) {
    if (data.length <= 1) return pad.l + innerW / 2;
    return pad.l + (i / (data.length - 1)) * innerW;
  }
  function yAt(v: number) {
    return pad.t + innerH - (v / maxY) * innerH;
  }
  function pathFor(key: "pv" | "uv") {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(d[key])}`)
      .join(" ");
  }

  const grid = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const y = pad.t + innerH * (1 - t);
    const label = Math.round(maxY * t);
    return { y, label };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {grid.map((g) => (
        <g key={g.label}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={g.y}
            y2={g.y}
            stroke="#eef0ee"
            strokeWidth={1}
          />
          <text x={pad.l - 8} y={g.y + 4} textAnchor="end" fontSize={11} fill="#999">
            {g.label}
          </text>
        </g>
      ))}
      <path d={pathFor("pv")} fill="none" stroke="#0b6e4f" strokeWidth={2.5} />
      <path
        d={pathFor("uv")}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="5 4"
      />
      {data.map((d, i) => (
        <g key={d.date}>
          <circle cx={xAt(i)} cy={yAt(d.pv)} r={3.5} fill="#0b6e4f" />
          <circle cx={xAt(i)} cy={yAt(d.uv)} r={3} fill="#3b82f6" />
          <text
            x={xAt(i)}
            y={h - 10}
            textAnchor="middle"
            fontSize={11}
            fill="#888"
          >
            {d.date.slice(5)}
          </text>
        </g>
      ))}
      <g transform={`translate(${pad.l}, 8)`}>
        <rect x={0} y={0} width={10} height={3} fill="#0b6e4f" rx={1} />
        <text x={14} y={4} fontSize={11} fill="#666">
          PV
        </text>
        <rect x={48} y={0} width={10} height={3} fill="#3b82f6" rx={1} />
        <text x={62} y={4} fontSize={11} fill="#666">
          UV
        </text>
      </g>
    </svg>
  );
}

/** 热门路径横向条形图 */
export function PathBarChart({ data }: { data: { path: string; pv: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.pv));
  if (!data.length) {
    return <div style={{ color: "#999", padding: 24, textAlign: "center" }}>暂无数据</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.slice(0, 8).map((row) => (
        <div key={row.path}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 4,
              gap: 8,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#333",
              }}
              title={row.path}
            >
              {row.path || "/"}
            </span>
            <span style={{ color: "#0b6e4f", fontWeight: 600, flexShrink: 0 }}>
              {row.pv}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "#eef5f1",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(row.pv / max) * 100}%`,
                height: "100%",
                borderRadius: 4,
                background: "linear-gradient(90deg, #0b6e4f, #2d9f6f)",
                minWidth: row.pv > 0 ? 4 : 0,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
