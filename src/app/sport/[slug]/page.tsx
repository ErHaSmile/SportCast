import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import SportArchive from "@/components/site/SportArchive";
import { resolveMediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function SportCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.sportCategory.findFirst({
    where: { slug, enabled: true },
  });
  if (!category) notFound();

  const schedules = await prisma.schedule.findMany({
    where: { categoryId: category.id },
    include: { stream: true },
    orderBy: [{ isReplay: "asc" }, { sort: "asc" }, { startAt: "desc" }],
  });

  const [coverUrl, itemCovers, streamCovers, replayUrls] = await Promise.all([
    resolveMediaUrl(category.coverUrl),
    Promise.all(schedules.map((s) => resolveMediaUrl(s.coverUrl))),
    Promise.all(schedules.map((s) => resolveMediaUrl(s.stream?.coverUrl || null))),
    Promise.all(
      schedules.map((s) =>
        s.isReplay ? resolveMediaUrl(s.replayUrl, { kind: "video" }) : Promise.resolve(null),
      ),
    ),
  ]);

  const headers = await prisma.partner.findMany({
    where: { enabled: true, group: "HEADER" },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const headerLogos = await Promise.all(headers.map((h) => resolveMediaUrl(h.logoUrl)));
  const config = await prisma.siteConfig.findUnique({ where: { id: "default" } });

  function hostLabel(url?: string | null) {
    if (!url) return "";
    try {
      return new URL(url).host.replace(/^www\./, "");
    } catch {
      return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }
  }

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
          <Link href="/" className="brand-chip">
            SPORTCAST LIVE
          </Link>
        </header>

        <SportArchive
          category={{
            name: category.name,
            slug: category.slug,
            description: category.description,
            badge: category.badge,
            coverUrl: coverUrl || null,
          }}
          items={schedules.map((s, idx) => ({
            id: s.id,
            title: s.title,
            location: s.location,
            startAt: s.startAt.toISOString(),
            summary: s.summary,
            coverUrl: itemCovers[idx] || null,
            isReplay: s.isReplay,
            replayUrl: replayUrls[idx] || s.replayUrl,
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
        />
      </div>

      <footer className="site-footer">
        <div>{config?.footerCopyright}</div>
        <div>{config?.footerIcp}</div>
      </footer>
    </div>
  );
}
