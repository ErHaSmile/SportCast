import Link from "next/link";

export type SportCategoryCard = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string | null;
  badge?: string;
  scheduleCount?: number;
};

export default function SportCategoryRail({
  items,
}: {
  items: SportCategoryCard[];
}) {
  if (!items.length) return null;

  return (
    <section className="sport-rail" aria-label="体育项目分类">
      <div className="sport-rail-head">
        <h3>体育项目</h3>
        <span>点击进入项目专区，观看直播与往期回放</span>
      </div>
      <div className="sport-rail-track">
        {items.map((item) => (
          <Link key={item.id} href={`/sport/${item.slug}`} className="sport-rail-card">
            <div className="sport-rail-cover">
              {item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.coverUrl} alt="" />
              ) : (
                <div className="sport-rail-fallback">{item.name.slice(0, 1)}</div>
              )}
              <div className="sport-rail-shade" />
              {item.badge ? <span className="sport-rail-badge">{item.badge}</span> : null}
              <div className="sport-rail-meta">
                <strong>{item.name}</strong>
                <em>{item.scheduleCount ?? 0} 场内容</em>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
