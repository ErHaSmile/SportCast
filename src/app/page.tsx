import { prisma } from "@/lib/prisma";
import SideTabs from "@/components/site/SideTabs";
import SportCategoryRail from "@/components/site/SportCategoryRail";
import { resolveMediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

function hostLabel(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export default async function HomePage() {
  const [config, headers, partners, liveSchedules, replays, defaultStream, categories] =
    await Promise.all([
      prisma.siteConfig.findUnique({ where: { id: "default" } }),
      prisma.partner.findMany({
        where: { enabled: true, group: "HEADER" },
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      }),
      prisma.partner.findMany({
        where: { enabled: true, group: "PARTNER" },
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      }),
      prisma.schedule.findMany({
        where: { isReplay: false },
        include: { stream: true },
        orderBy: [{ sort: "asc" }, { startAt: "asc" }],
      }),
      prisma.schedule.findMany({
        where: { isReplay: true },
        orderBy: [{ sort: "asc" }, { startAt: "desc" }],
      }),
      prisma.stream.findFirst({
        where: { status: "ON" },
        orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      }),
      prisma.sportCategory.findMany({
        where: { enabled: true },
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { schedules: true } } },
      }),
    ]);

  const [
    heroImageUrl,
    headerLogos,
    partnerLogos,
    liveCovers,
    streamCovers,
    replayCovers,
    defaultCover,
    categoryCovers,
  ] = await Promise.all([
    resolveMediaUrl(config?.heroImageUrl || "/covers/event-hero.svg"),
    Promise.all(headers.map((h) => resolveMediaUrl(h.logoUrl))),
    Promise.all(partners.map((p) => resolveMediaUrl(p.logoUrl))),
    Promise.all(liveSchedules.map((s) => resolveMediaUrl(s.coverUrl))),
    Promise.all(
      liveSchedules.map((s) => resolveMediaUrl(s.stream?.coverUrl || null)),
    ),
    Promise.all(replays.map((s) => resolveMediaUrl(s.coverUrl))),
    resolveMediaUrl(defaultStream?.coverUrl || null),
    Promise.all(categories.map((c) => resolveMediaUrl(c.coverUrl))),
  ]);

  const footerLinks = (config?.footerLinks || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const orgs = [
    config?.hostUnits,
    config?.organizeUnits,
    config?.coOrganizeUnits,
    config?.supportUnits,
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="portal">
      <div className="portal-inner">
        <header className="top-bar">
          <div className="top-links">
            {headers.map((item, idx) => (
              <a
                key={item.id}
                className="top-link"
                href={item.url || "#"}
                target="_blank"
                rel="noreferrer"
              >
                <div className="top-link-logo">
                  {headerLogos[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerLogos[idx]} alt={item.name} />
                  ) : (
                    <span>{item.name.slice(0, 2)}</span>
                  )}
                </div>
                <span className="top-link-url">{hostLabel(item.url) || item.name}</span>
              </a>
            ))}
          </div>
          <div className="brand-chip">SPORTCAST LIVE</div>
        </header>

        <section className="hero-banner">
          <div className="hero-kicker">
            {config?.eventSubtitle || "赛事直播专题"}
          </div>
          <h1>{config?.bannerTitle || config?.eventTitle || "赛事直播专题"}</h1>
        </section>

        <div className="content-head">
          <span className="cam" aria-hidden />
          <h2>{config?.eventTitle}</h2>
        </div>
        <p className="content-meta">
          {[config?.eventDateText, config?.sourceText].filter(Boolean).join("　")}
        </p>

        <SportCategoryRail
          items={categories.map((c, idx) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            badge: c.badge,
            coverUrl: categoryCovers[idx] || null,
            scheduleCount: c._count.schedules,
          }))}
        />

        <SideTabs
          liveSchedules={liveSchedules.map((s, idx) => ({
            id: s.id,
            title: s.title,
            location: s.location,
            startAt: s.startAt.toISOString(),
            endAt: s.endAt?.toISOString() || null,
            streamId: s.streamId,
            replayUrl: s.replayUrl,
            detailUrl: s.detailUrl,
            coverUrl: liveCovers[idx] || null,
            summary: s.summary,
            isReplay: s.isReplay,
            stream: s.stream
              ? {
                  id: s.stream.id,
                  name: s.stream.name,
                  type: s.stream.type,
                  url: s.stream.url,
                  coverUrl: streamCovers[idx] || null,
                }
              : null,
          }))}
          replays={replays.map((s, idx) => ({
            id: s.id,
            title: s.title,
            location: s.location,
            startAt: s.startAt.toISOString(),
            endAt: s.endAt?.toISOString() || null,
            streamId: s.streamId,
            replayUrl: s.replayUrl,
            detailUrl: s.detailUrl,
            coverUrl: replayCovers[idx] || null,
            summary: s.summary,
            isReplay: s.isReplay,
          }))}
          defaultStream={
            defaultStream
              ? {
                  id: defaultStream.id,
                  name: defaultStream.name,
                  type: defaultStream.type,
                  url: defaultStream.url,
                  coverUrl: defaultCover || null,
                }
              : null
          }
          poster={{
            slogan: config?.slogan || "",
            title: config?.bannerTitle || config?.eventTitle || "",
            orgs,
            locationText: config?.locationText || "",
            heroImageUrl: heroImageUrl || "/covers/event-hero.svg",
          }}
        />

        <section className="partners">
          <h3>合作单位</h3>
          <div className="partner-grid">
            {partners.map((p, idx) => {
              const inner = (
                <>
                  <div className="partner-logo">
                    {partnerLogos[idx] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={partnerLogos[idx]} alt={p.name} />
                    ) : (
                      <span>{p.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="partner-name">{p.name}</div>
                  {p.url && <div className="partner-url">{hostLabel(p.url)}</div>}
                </>
              );
              return p.url ? (
                <a
                  key={p.id}
                  className="partner-card"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <div key={p.id} className="partner-card">
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="site-footer">
        {footerLinks.length > 0 && (
          <div className="footer-links">
            {footerLinks.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        )}
        <div>{config?.footerCopyright}</div>
        <div>{config?.footerIcp}</div>
        <div>{config?.footerContact}</div>
      </footer>
    </div>
  );
}
