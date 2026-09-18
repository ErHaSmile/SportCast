"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import LivePlayer from "./LivePlayer";

export type PortalStream = {
  id: string;
  name: string;
  type: string;
  url: string;
  coverUrl?: string | null;
};

export type PortalSchedule = {
  id: string;
  title: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
  streamId: string | null;
  replayUrl: string | null;
  detailUrl: string | null;
  summary?: string;
  coverUrl?: string | null;
  isReplay: boolean;
  stream?: PortalStream | null;
};

export type PosterInfo = {
  slogan: string;
  title: string;
  orgs: string[];
  locationText: string;
  heroImageUrl?: string;
};

type Props = {
  liveSchedules: PortalSchedule[];
  replays: PortalSchedule[];
  defaultStream: PortalStream | null;
  poster: PosterInfo;
};

export default function SideTabs({
  liveSchedules,
  replays,
  defaultStream,
  poster,
}: Props) {
  const [tab, setTab] = useState<"live" | "replay">("live");
  const [activeLiveId, setActiveLiveId] = useState<string | null>(
    liveSchedules[0]?.id ?? null,
  );

  // 中间区域始终播放选中直播；默认第一场（或默认直播源）
  const playing = useMemo(() => {
    const live =
      liveSchedules.find((s) => s.id === activeLiveId) || liveSchedules[0];
    if (live?.stream?.url) {
      return {
        title: live.title,
        type: live.stream.type,
        url: live.stream.url,
        cover: live.coverUrl || live.stream.coverUrl || poster.heroImageUrl,
      };
    }
    if (defaultStream?.url) {
      return {
        title: defaultStream.name,
        type: defaultStream.type,
        url: defaultStream.url,
        cover: defaultStream.coverUrl || poster.heroImageUrl,
      };
    }
    return null;
  }, [activeLiveId, liveSchedules, defaultStream, poster.heroImageUrl]);

  const list = tab === "live" ? liveSchedules : replays;

  function onItemClick(item: PortalSchedule) {
    if (item.isReplay) {
      window.open(`/replay/${item.id}`, "_blank", "noopener,noreferrer");
      return;
    }
    setActiveLiveId(item.id);
  }

  return (
    <div className="main-grid">
      <div className="stage-col">
        <div className="stage-shell">
          {playing ? (
            <LivePlayer
              type={playing.type}
              url={playing.url}
              title={playing.title}
              poster={playing.cover}
              isLive
            />
          ) : (
            <div
              className="poster-layer"
              style={
                poster.heroImageUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(12,18,32,.25), rgba(12,18,32,.88)), url(${poster.heroImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div>
                <div className="poster-badge">LIVE SPORTS</div>
                <div className="poster-slogan">{poster.slogan}</div>
                <div className="poster-title">{poster.title}</div>
              </div>
              <div>
                <div className="poster-orgs">
                  {poster.orgs.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                {poster.locationText && (
                  <div className="poster-loc">{poster.locationText}</div>
                )}
                <div className="poster-hint">暂无可用直播信号</div>
              </div>
            </div>
          )}
        </div>
        {playing && <div className="now-playing">正在直播：{playing.title}</div>}
      </div>

      <aside className="side-panel">
        <div className="side-tabs">
          <button
            type="button"
            className={tab === "live" ? "side-tab active" : "side-tab"}
            onClick={() => setTab("live")}
          >
            直播赛程
          </button>
          <button
            type="button"
            className={tab === "replay" ? "side-tab active" : "side-tab"}
            onClick={() => setTab("replay")}
          >
            往期精彩回顾
          </button>
        </div>

        <ul className={tab === "replay" ? "side-list side-list-replay" : "side-list side-list-live"}>
          {list.length === 0 && <li className="side-empty">暂无数据</li>}
          {list.map((item) => {
            const active =
              !item.isReplay && item.id === activeLiveId && tab === "live";
            return (
              <li key={item.id} className={item.isReplay ? "replay-row" : "live-row"}>
                <button
                  type="button"
                  className={
                    item.isReplay
                      ? "side-item side-item-replay"
                      : active
                        ? "side-item side-item-live active"
                        : "side-item side-item-live"
                  }
                  onClick={() => onItemClick(item)}
                  aria-pressed={active}
                >
                  {item.isReplay ? (
                    <>
                      <span className="replay-thumb" aria-hidden>
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.coverUrl} alt="" />
                        ) : (
                          <span className="side-dot" />
                        )}
                      </span>
                      <span className="replay-body">
                        <span className="replay-title-row">
                          <span className="side-title">{item.title}</span>
                          <span className="side-date">
                            {dayjs(item.startAt).format("YYYY/MM/DD")}
                          </span>
                        </span>
                        <span className="replay-summary">
                          {item.summary || "点击查看详情"}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="side-item-main">
                        <span className="side-dot" aria-hidden />
                        <span className="side-copy">
                          <span className="side-title">{item.title}</span>
                          {item.location && (
                            <span className="side-loc">{item.location}</span>
                          )}
                        </span>
                      </span>
                      <span className="side-meta">
                        {active && <span className="side-live-tag">播放中</span>}
                        <span className="side-date">
                          {dayjs(item.startAt).format("MM/DD HH:mm")}
                        </span>
                      </span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
