"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { isNativeVideoUrl } from "@/lib/media";

type Props = {
  type: "HLS" | "H5" | string;
  url: string;
  poster?: string;
  title?: string;
  /** 直播模式：隐藏进度条与总时长，展示 LIVE 态 */
  isLive?: boolean;
  /** 后台预览：强制原生控件，便于确认是否可播 */
  forceControls?: boolean;
};

function isFileVideo(url: string, type?: string) {
  return isNativeVideoUrl(url, type);
}

export default function LivePlayer({
  type,
  url,
  poster,
  title,
  isLive = false,
  forceControls = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useNativeControls = forceControls || !isLive;

  useEffect(() => {
    if (type === "H5" || !url) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let disposed = false;
    setPlaying(false);
    setLoading(true);
    setError(null);

    const tryPlay = async (preferUnmuted: boolean) => {
      if (disposed) return;
      if (preferUnmuted) {
        video.muted = false;
        setMuted(false);
        try {
          await video.play();
          return;
        } catch {
          // 浏览器常拦截有声自动播放，降级静音再试
        }
      }
      video.muted = true;
      setMuted(true);
      try {
        await video.play();
      } catch {
        setPlaying(false);
      }
    };

    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onVolume = () => setMuted(video.muted);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => {
      setLoading(false);
      setError(null);
    };
    const onVideoError = () => {
      setLoading(false);
      setError("视频加载失败，请检查地址是否可访问或是否被跨域限制");
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onVideoError);

    if (isFileVideo(url, type)) {
      video.src = url;
      void tryPlay(true);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      void tryPlay(true);
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        liveDurationInfinity: isLive && !forceControls,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void tryPlay(true);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        setLoading(false);
        const detail =
          data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? "网络错误：源地址无法拉取（可能已失效、被墙或跨域）"
            : data.type === Hls.ErrorTypes.MEDIA_ERROR
              ? "媒体错误：流格式不兼容"
              : "播放失败：源不可用";
        setError(detail);
        hls?.destroy();
        hls = null;
      });
    } else {
      setError("当前浏览器不支持 HLS 播放");
      setLoading(false);
    }

    return () => {
      disposed = true;
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [type, url, isLive, forceControls]);

  if (!url) {
    return <div className="player-empty">暂无直播信号</div>;
  }

  if (type === "H5") {
    return (
      <iframe
        className="player-frame"
        src={url}
        title={title || (isLive ? "直播" : "回放")}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function toggleFullscreen() {
    const root = videoRef.current?.parentElement || videoRef.current;
    if (!root) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void root.requestFullscreen?.();
    }
  }

  if (useNativeControls) {
    return (
      <div className="player-wrap">
        <video
          ref={videoRef}
          className="player-video"
          controls
          playsInline
          poster={poster}
        />
        {loading && !error && <div className="player-overlay">加载中…</div>}
        {error && <div className="player-overlay player-overlay-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="live-player">
      <video
        ref={videoRef}
        className="player-video"
        playsInline
        poster={poster}
        onClick={togglePlay}
      />
      {loading && !error && <div className="player-overlay">加载中…</div>}
      {error && <div className="player-overlay player-overlay-error">{error}</div>}
      <div className="live-player-bar">
        <div className="live-player-left">
          <span className="live-badge" aria-label="直播中">
            <i />
            LIVE
          </span>
          <button type="button" className="live-ctrl" onClick={togglePlay}>
            {playing ? "暂停" : "播放"}
          </button>
        </div>
        <div className="live-player-right">
          <button type="button" className="live-ctrl" onClick={toggleMute}>
            {muted ? "取消静音" : "静音"}
          </button>
          <button type="button" className="live-ctrl" onClick={toggleFullscreen}>
            全屏
          </button>
        </div>
      </div>
    </div>
  );
}
