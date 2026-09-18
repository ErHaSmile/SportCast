import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import dayjs from "dayjs";
import Link from "next/link";
import LivePlayer from "@/components/site/LivePlayer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function videoType(url: string) {
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes("/uploads/videos/")) {
    return "FILE";
  }
  return "HLS";
}

export default async function ReplayPage({ params }: Props) {
  const { id } = await params;
  const item = await prisma.schedule.findUnique({ where: { id } });
  if (!item || !item.isReplay) notFound();

  const videoUrl = item.replayUrl?.trim() || "";
  const hasVideo = Boolean(videoUrl);

  return (
    <div className="portal replay-page">
      <div className="portal-inner replay-inner">
        <div className="replay-top">
          <Link href="/" className="replay-back">
            ← 返回赛事门户
          </Link>
          <span className="replay-tag">{hasVideo ? "录像回放" : "图文专题"}</span>
        </div>

        <article className="replay-card">
          <header className="replay-header">
            <h1>{item.title}</h1>
            <p className="replay-meta">
              {dayjs(item.startAt).format("YYYY年MM月DD日")}
              {item.location ? ` · ${item.location}` : ""}
            </p>
            {item.summary && <p className="replay-summary">{item.summary}</p>}
          </header>

          {hasVideo ? (
            <div className="replay-player">
              <LivePlayer
                type={videoType(videoUrl)}
                url={videoUrl}
                title={item.title}
                poster={item.coverUrl || undefined}
                isLive={false}
              />
            </div>
          ) : item.coverUrl ? (
            <div className="replay-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.coverUrl} alt={item.title} />
            </div>
          ) : (
            <div className="replay-novideo">本专题为图文内容，暂无回放视频</div>
          )}

          {item.content && (
            <div className="replay-content">
              {item.content.split("\n").map((line, idx) =>
                line.trim() ? <p key={idx}>{line}</p> : <br key={idx} />,
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
