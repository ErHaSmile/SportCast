"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import LivePlayer from "@/components/site/LivePlayer";
import { isNativeVideoUrl } from "@/lib/media";

export type SportItem = {
  id: string;
  title: string;
  location: string | null;
  startAt: string;
  summary?: string;
  coverUrl?: string | null;
  isReplay: boolean;
  replayUrl?: string | null;
  stream?: {
    id: string;
    name: string;
    type: string;
    url: string;
    coverUrl?: string | null;
  } | null;
};

type Props = {
  category: {
    name: string;
    slug: string;
    description: string;
    badge?: string;
    coverUrl?: string | null;
  };
  items: SportItem[];
};

type Filter = "all" | "live" | "replay";

export default function SportArchive({ category, items }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(() => {
    const live = items.find((i) => !i.isReplay && i.stream?.url);
    return live?.id || items[0]?.id || null;
  });

  const filtered = useMemo(() => {
    if (filter === "live") return items.filter((i) => !i.isReplay);
    if (filter === "replay") return items.filter((i) => i.isReplay);
    return items;
  }, [filter, items]);

  const active = useMemo(
    () => items.find((i) => i.id === activeId) || filtered[0] || null,
    [activeId, items, filtered],
  );

  const playing = useMemo(() => {
    if (!active) return null;
    if (!active.isReplay && active.stream?.url) {
      return {
        type: active.stream.type,
        url: active.stream.url,
        title: active.title,
        poster: active.coverUrl || active.stream.coverUrl || category.coverUrl,
        isLive: true,
      };
    }
    if (active.isReplay && active.replayUrl) {
      return {
        type: isNativeVideoUrl(active.replayUrl) ? "FILE" : "HLS",
        url: active.replayUrl,
        title: active.title,
        poster: active.coverUrl || category.coverUrl,
        isLive: false,
      };
    }
    return null;
  }, [active, category.coverUrl]);

  const liveCount = items.filter((i) => !i.isReplay).length;
  const replayCount = items.filter((i) => i.isReplay).length;

  return (
    <div className="sport-archive">
      <section
        className="sport-hero"
        style={
          category.coverUrl
            ? {
                backgroundImage: `linear-gradient(100deg, rgba(11,18,32,.92), rgba(155,34,38,.55) 48%, rgba(11,18,32,.88)), url(${category.coverUrl})`,
              }
            : undefined
        }
      >
        <Link href="/" className="sport-back">
          ← 返回直播门户
        </Link>
        <div className="sport-hero-body">
          {category.badge ? <span className="sport-hero-badge">{category.badge}</span> : null}
          <h1>{category.name}</h1>
          <p>
            {category.description ||
              `汇集 ${category.name} 相关直播与精彩回放，点击下方卡片即可观看。`}
          </p>
          <div className="sport-hero-stats">
            <span>{items.length} 场内容</span>
            <span>{liveCount} 直播</span>
            <span>{replayCount} 回放</span>
          </div>
        </div>
      </section>

      <div className="sport-stage-grid">
        <div className="sport-stage">
          <div className="stage-shell">
            {playing ? (
              <LivePlayer
                type={playing.type}
                url={playing.url}
                title={playing.title}
                poster={playing.poster || undefined}
                isLive={playing.isLive}
              />
            ) : (
              <div className="sport-stage-empty">
                <strong>选择一场直播或回放开始观看</strong>
                <span>左侧列表点击即可切换</span>
              </div>
            )}
          </div>
          {active && (
            <div className="sport-now">
              <div>
                <span className={`sport-pill ${active.isReplay ? "replay" : "live"}`}>
                  {active.isReplay ? "回放" : "直播"}
                </span>
                <h2>{active.title}</h2>
                <p>
                  {dayjs(active.startAt).format("YYYY年MM月DD日 HH:mm")}
                  {active.location ? ` · ${active.location}` : ""}
                </p>
                {active.summary ? <p className="sport-now-summary">{active.summary}</p> : null}
              </div>
              {active.isReplay && (
                <Link href={`/replay/${active.id}`} className="sport-detail-btn">
                  打开详情页
                </Link>
              )}
            </div>
          )}
        </div>

        <aside className="sport-side">
          <div className="sport-filters">
            {(
              [
                ["all", "全部"],
                ["live", "直播"],
                ["replay", "回放"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "on" : ""}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="sport-side-list">
            {filtered.length === 0 ? (
              <div className="sport-empty">该筛选下暂无内容</div>
            ) : (
              filtered.map((item) => {
                const on = item.id === active?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sport-side-item ${on ? "on" : ""}`}
                    onClick={() => setActiveId(item.id)}
                  >
                    <div className="sport-side-thumb">
                      {item.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.coverUrl} alt="" />
                      ) : (
                        <span>{item.title.slice(0, 1)}</span>
                      )}
                      <em className={item.isReplay ? "replay" : "live"}>
                        {item.isReplay ? "回放" : "LIVE"}
                      </em>
                    </div>
                    <div className="sport-side-copy">
                      <strong>{item.title}</strong>
                      <span>{dayjs(item.startAt).format("YYYY/MM/DD")}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>

      <section className="sport-grid-section">
        <div className="sport-rail-head">
          <h3>全部节目</h3>
          <span>点选卡片即可在上方播放器观看</span>
        </div>
        <div className="sport-card-grid">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sport-vod-card ${item.id === active?.id ? "on" : ""}`}
              onClick={() => {
                setActiveId(item.id);
                setFilter("all");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <div className="sport-vod-thumb">
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverUrl} alt="" />
                ) : (
                  <div className="sport-rail-fallback">{item.title.slice(0, 1)}</div>
                )}
                <span className={`sport-vod-flag ${item.isReplay ? "replay" : "live"}`}>
                  {item.isReplay ? "回放" : "直播"}
                </span>
              </div>
              <div className="sport-vod-body">
                <strong>{item.title}</strong>
                <span>
                  {dayjs(item.startAt).format("YYYY/MM/DD")}
                  {item.location ? ` · ${item.location}` : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
