import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import dayjs from "dayjs";
import Link from "next/link";
import LivePlayer from "@/components/site/LivePlayer";
import { isNativeVideoUrl } from "@/lib/media";
import { resolveMediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function videoType(url: string) {
  return isNativeVideoUrl(url) ? "FILE" : "HLS";
}

export default async function ReplayPage({ params }: Props) {
  const { id } = await params;
  const item = await prisma.schedule.findUnique({ where: { id } });
  if (!item || !item.isReplay) notFound();

  const storedVideo = item.replayUrl?.trim() || "";
  const [videoUrl, coverUrl] = await Promise.all([
    resolveMediaUrl(storedVideo || null, { kind: "video" }),
    resolveMediaUrl(item.coverUrl),
  ]);
  const hasVideo = Boolean(storedVideo);

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
                type={videoType(storedVideo)}
                url={videoUrl}
                title={item.title}
                poster={coverUrl || undefined}
                isLive={false}
              />
            </div>
          ) : coverUrl ? (
            <div className="replay-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={item.title} />
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
