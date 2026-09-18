/**
 * 生产库安全初始化体育项目（不删业务数据）
 * 用法：DATABASE_URL=... pnpm exec tsx scripts/bootstrap-categories.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATS = [
  {
    name: "攀岩",
    slug: "climbing",
    badge: "热门",
    description: "速度攀岩、难度攀岩与攀石赛事直播与精彩回放。",
    coverUrl: "/covers/climbing-live.svg",
    keywords: ["攀岩", "攀石"],
    sort: 1,
  },
  {
    name: "射箭",
    slug: "archery",
    badge: "奥运",
    description: "全国射箭巡回赛及重点赛事集锦。",
    coverUrl: "/covers/climbing-lead.svg",
    keywords: ["射箭"],
    sort: 2,
  },
  {
    name: "足球",
    slug: "football",
    badge: "联赛",
    description: "青少年与职业足球赛事直播回看。",
    coverUrl: "/covers/climbing-speed.svg",
    keywords: ["足球", "U18"],
    sort: 3,
  },
  {
    name: "空手道",
    slug: "karate",
    badge: "",
    description: "空手道锦标赛与公开赛录像。",
    coverUrl: "/covers/event-hero.svg",
    keywords: ["空手道"],
    sort: 4,
  },
  {
    name: "跆拳道",
    slug: "taekwondo",
    badge: "",
    description: "跆拳道公开赛与积分赛精彩回顾。",
    coverUrl: "/covers/climbing-live.svg",
    keywords: ["跆拳道"],
    sort: 5,
  },
  {
    name: "曲棍球",
    slug: "hockey",
    badge: "",
    description: "曲棍球联赛与国家队相关赛事。",
    coverUrl: "/covers/climbing-lead.svg",
    keywords: ["曲棍球"],
    sort: 6,
  },
];

async function main() {
  for (const cat of CATS) {
    const row = await prisma.sportCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        badge: cat.badge,
        description: cat.description,
        coverUrl: cat.coverUrl,
        sort: cat.sort,
        enabled: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        badge: cat.badge,
        description: cat.description,
        coverUrl: cat.coverUrl,
        sort: cat.sort,
        enabled: true,
      },
    });

    const schedules = await prisma.schedule.findMany({
      where: {
        OR: cat.keywords.map((k) => ({ title: { contains: k } })),
      },
      select: { id: true, categoryId: true, title: true },
    });

    for (const s of schedules) {
      if (s.categoryId) continue;
      await prisma.schedule.update({
        where: { id: s.id },
        data: { categoryId: row.id },
      });
      console.log(`linked ${s.title} -> ${cat.name}`);
    }
  }
  console.log("bootstrap categories OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
