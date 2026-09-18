import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: { username: "admin", passwordHash },
  });

  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {
      eventTitle: "2026年中国攀岩联赛（贵州贵阳站）",
      eventSubtitle: "中国攀岩联赛 · 官方直播",
      eventDateText: "2026年8月4日-5日",
      bannerTitle: "2026中国攀岩联赛(贵州贵阳站)",
      slogan: "美美与共 攀无止境",
      sourceText: "中国登山协会官网",
      locationText: "8月4-5日 贵州·贵阳·观山湖",
      hostUnits:
        "主办单位：国家体育总局登山运动管理中心、中国登山协会、贵州省体育局、贵阳市人民政府",
      organizeUnits:
        "承办单位：贵州省山地户外运动发展中心、贵阳市体育局、贵阳市观山湖区人民政府",
      coOrganizeUnits:
        "协办单位：贵阳市人民政府网、观山湖区文化体育广播电视旅游局",
      supportUnits: "支持单位：贵州省体育彩票管理中心、贵州省体育发展基金会",
      heroImageUrl: "/covers/event-hero.svg",
      footerLinks: "关于我们|隐私保护|广告服务|招聘英才|联系我们",
      footerCopyright: "© 2003-2026 赛播云 SportCast. All rights reserved.",
      footerIcp: "网络视听许可证 · ICP备案号待填写",
      footerContact: "客服电话：400-000-0000　邮箱：service@sportcast.local",
    },
    create: {
      id: "default",
      eventTitle: "2026年中国攀岩联赛（贵州贵阳站）",
      eventSubtitle: "中国攀岩联赛 · 官方直播",
      eventDateText: "2026年8月4日-5日",
      bannerTitle: "2026中国攀岩联赛(贵州贵阳站)",
      slogan: "美美与共 攀无止境",
      sourceText: "中国登山协会官网",
      locationText: "8月4-5日 贵州·贵阳·观山湖",
      hostUnits:
        "主办单位：国家体育总局登山运动管理中心、中国登山协会、贵州省体育局、贵阳市人民政府",
      organizeUnits:
        "承办单位：贵州省山地户外运动发展中心、贵阳市体育局、贵阳市观山湖区人民政府",
      coOrganizeUnits:
        "协办单位：贵阳市人民政府网、观山湖区文化体育广播电视旅游局",
      supportUnits: "支持单位：贵州省体育彩票管理中心、贵州省体育发展基金会",
      heroImageUrl: "/covers/event-hero.svg",
      footerLinks: "关于我们|隐私保护|广告服务|招聘英才|联系我们",
      footerCopyright: "© 2003-2026 赛播云 SportCast. All rights reserved.",
      footerIcp: "网络视听许可证 · ICP备案号待填写",
      footerContact: "客服电话：400-000-0000　邮箱：service@sportcast.local",
    },
  });

  await prisma.partner.deleteMany({});
  await prisma.partner.createMany({
    data: [
      {
        name: "中国奥委会",
        url: "https://www.olympic.cn",
        group: "HEADER",
        logoUrl: "/logos/olympic.svg",
        sort: 1,
      },
      {
        name: "国家体育总局",
        url: "https://www.sport.gov.cn",
        group: "HEADER",
        logoUrl: "/logos/sport-gov.svg",
        sort: 2,
      },
      {
        name: "华奥星空",
        url: "https://www.sports.cn",
        group: "HEADER",
        logoUrl: "/logos/sports-cn.svg",
        sort: 3,
      },
      {
        name: "中国登山协会",
        url: "https://cmasports.sport.org.cn",
        group: "PARTNER",
        logoUrl: "/logos/climbing.svg",
        sort: 1,
      },
      {
        name: "中国奥委会官网",
        url: "https://www.olympic.cn",
        group: "PARTNER",
        logoUrl: "/logos/olympic.svg",
        sort: 2,
      },
      {
        name: "中华全国体育总会",
        url: "https://www.sport.org.cn",
        group: "PARTNER",
        logoUrl: "/logos/sport-org.svg",
        sort: 3,
      },
      {
        name: "华奥星空",
        url: "https://www.sports.cn",
        group: "PARTNER",
        logoUrl: "/logos/sports-cn.svg",
        sort: 4,
      },
    ],
  });

  await prisma.schedule.deleteMany({});
  await prisma.stream.deleteMany({});

  // 公开可播 HLS（带 CORS，适合本地联调）。第三方体育台常失效/地区限制，故用稳定演示源。
  const streamA = await prisma.stream.create({
    data: {
      name: "演示源 A · Mux Big Buck Bunny",
      type: "HLS",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      status: "ON",
      sort: 0,
      coverUrl: "/covers/climbing-live.svg",
    },
  });

  const streamB = await prisma.stream.create({
    data: {
      name: "演示源 B · Tears of Steel",
      type: "HLS",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      status: "ON",
      sort: 1,
      coverUrl: "/covers/climbing-speed.svg",
    },
  });

  const streamC = await prisma.stream.create({
    data: {
      name: "演示源 C · Akamai Live 测试",
      type: "HLS",
      url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      status: "ON",
      sort: 2,
      coverUrl: "/covers/climbing-lead.svg",
    },
  });

  // 前 3 场直播分别绑定三个测试源，其余默认绑 A
  const liveStreamIds = [
    streamA.id,
    streamB.id,
    streamC.id,
    streamA.id,
    streamA.id,
    streamA.id,
    streamA.id,
    streamA.id,
    streamA.id,
    streamA.id,
  ];

  const liveTitles = [
    "男子速度赛预赛",
    "女子速度赛预赛",
    "男子/女子难度预赛",
    "男子/女子速度决赛",
    "男子难度决赛",
    "女子难度决赛",
    "男子攀石资格赛",
    "女子攀石资格赛",
    "男子攀石决赛",
    "女子攀石决赛",
  ];

  const liveCovers = [
    "/covers/climbing-speed.svg",
    "/covers/climbing-speed.svg",
    "/covers/climbing-lead.svg",
    "/covers/climbing-speed.svg",
    "/covers/climbing-lead.svg",
    "/covers/climbing-lead.svg",
    "/covers/climbing-live.svg",
    "/covers/climbing-live.svg",
    "/covers/event-hero.svg",
    "/covers/event-hero.svg",
  ];

  const liveStarts = [
    "2026-08-04T09:30:00",
    "2026-08-04T11:30:00",
    "2026-08-04T14:00:00",
    "2026-08-04T19:00:00",
    "2026-08-05T19:00:00",
    "2026-08-05T20:00:00",
    "2026-08-05T09:00:00",
    "2026-08-05T11:00:00",
    "2026-08-05T15:00:00",
    "2026-08-05T16:30:00",
  ];

  const liveEnds = [
    "2026-08-04T10:20:00",
    "2026-08-04T12:20:00",
    "2026-08-04T17:00:00",
    "2026-08-04T20:00:00",
    "2026-08-05T20:00:00",
    "2026-08-05T21:00:00",
    "2026-08-05T10:30:00",
    "2026-08-05T12:30:00",
    "2026-08-05T16:20:00",
    "2026-08-05T17:50:00",
  ];

  const replayItems = [
    {
      title: "2023年全国射箭巡回赛(暨全国射箭分站赛第二站)",
      location: "国家射箭队训练基地",
      startAt: "2023-09-06T09:00:00",
      coverUrl: "/covers/archery.svg",
      hasVideo: true,
      summary: "全国射箭巡回赛第二站精彩集锦，涵盖个人赛与团体赛高光时刻。",
    },
    {
      title: "2023年U18女子垒球亚洲杯",
      location: "亚洲杯赛区",
      startAt: "2023-08-29T09:00:00",
      coverUrl: "/covers/softball.svg",
      hasVideo: false,
      summary: "图文专题：U18 女子垒球亚洲杯赛况回顾（无视频，仅图文）。",
    },
    {
      title: "“奔跑吧·少年”2023年全国青少年空手道U系列赛（辽宁站）",
      location: "辽宁 · 沈阳",
      startAt: "2023-08-26T09:00:00",
      coverUrl: "/covers/karate.svg",
      hasVideo: true,
      summary: "青少年空手道 U 系列辽宁站，型与组手项目集锦。",
    },
    {
      title: "2023年全国跆拳道锦标赛系列赛（第四站）",
      location: "全国系列赛赛区",
      startAt: "2023-08-23T09:00:00",
      coverUrl: "/covers/taekwondo.svg",
      hasVideo: true,
      summary: "跆拳道系列赛第四站决赛回放与高光时刻。",
    },
    {
      title: "第四届中国中学生曲棍球锦标赛暨2023年青少年U系列全锦赛",
      location: "中学生锦标赛赛区",
      startAt: "2023-07-27T09:00:00",
      coverUrl: "/covers/hockey.svg",
      hasVideo: false,
      summary: "中学生曲棍球锦标赛图文专题（纯图文，无录像）。",
    },
    {
      title: "2024年中国攀岩联赛（成都站）速度决赛集锦",
      location: "四川 · 成都",
      startAt: "2024-05-18T19:00:00",
      coverUrl: "/covers/climbing-speed.svg",
      hasVideo: true,
      summary: "成都站速度决赛完整录像，含男子/女子金牌争夺战。",
    },
    {
      title: "2024年中国攀岩联赛（上海站）难度赛回放",
      location: "上海 · 静安",
      startAt: "2024-06-22T14:00:00",
      coverUrl: "/covers/climbing-lead.svg",
      hasVideo: true,
      summary: "上海站难度赛精彩线路与冲顶瞬间回顾。",
    },
    {
      title: "2024年全国攀岩锦标赛攀石项目决赛",
      location: "浙江 · 绍兴",
      startAt: "2024-07-12T15:30:00",
      coverUrl: "/covers/climbing-live.svg",
      hasVideo: true,
      summary: "全国锦标赛攀石决赛，多轮加试决出冠亚军。",
    },
    {
      title: "2023年亚洲攀岩锦标赛男子速度半决赛",
      location: "韩国 · 首尔",
      startAt: "2023-10-08T10:00:00",
      coverUrl: "/covers/climbing-speed.svg",
      hasVideo: true,
      summary: "亚洲锦标赛男子速度半决赛对决实录。",
    },
    {
      title: "2023年亚洲攀岩锦标赛女子难度决赛",
      location: "韩国 · 首尔",
      startAt: "2023-10-09T19:00:00",
      coverUrl: "/covers/climbing-lead.svg",
      hasVideo: true,
      summary: "女子难度决赛完整录像与赛后点评。",
    },
    {
      title: "2024年全国青年攀岩锦标赛（广东站）",
      location: "广东 · 广州",
      startAt: "2024-04-06T09:00:00",
      coverUrl: "/covers/event-hero.svg",
      hasVideo: true,
      summary: "青年组速度、难度、攀石三项综合集锦。",
    },
    {
      title: "2023年世界攀岩巡回赛（重庆站）精选",
      location: "重庆 · 南岸",
      startAt: "2023-11-15T18:00:00",
      coverUrl: "/covers/climbing-live.svg",
      hasVideo: true,
      summary: "世界巡回赛重庆站名场面合集。",
    },
    {
      title: "2024年中国攀岩联赛（昆明站）开幕式与热身赛",
      location: "云南 · 昆明",
      startAt: "2024-08-02T09:30:00",
      coverUrl: "/covers/event-hero.svg",
      hasVideo: false,
      summary: "昆明站开幕式图文回顾与赛场氛围速览。",
    },
    {
      title: "2023年全国群众攀岩挑战赛总决赛",
      location: "北京 · 朝阳",
      startAt: "2023-12-03T13:00:00",
      coverUrl: "/covers/climbing-speed.svg",
      hasVideo: true,
      summary: "群众挑战赛总决赛回放，记录业余高手对决。",
    },
    {
      title: "2024年高校攀岩联赛华东赛区决赛",
      location: "江苏 · 南京",
      startAt: "2024-03-24T14:00:00",
      coverUrl: "/covers/climbing-lead.svg",
      hasVideo: true,
      summary: "高校攀岩联赛华东决赛，多所高校争夺晋级名额。",
    },
    {
      title: "2023年国际攀岩大师赛（北京）精华版",
      location: "北京 · 石景山",
      startAt: "2023-09-20T19:30:00",
      coverUrl: "/covers/climbing-live.svg",
      hasVideo: true,
      summary: "国际大师赛北京站精华剪辑，含解说集锦。",
    },
    {
      title: "2024年中国攀岩联赛（青岛站）女子速度预赛",
      location: "山东 · 青岛",
      startAt: "2024-09-07T10:00:00",
      coverUrl: "/covers/climbing-speed.svg",
      hasVideo: true,
      summary: "青岛站女子速度预赛完整录像。",
    },
    {
      title: "2023年全国少年攀岩锦标赛图文专题",
      location: "福建 · 厦门",
      startAt: "2023-08-12T09:00:00",
      coverUrl: "/covers/softball.svg",
      hasVideo: false,
      summary: "少年锦标赛赛况图文汇总（无录像）。",
    },
    {
      title: "2024年中国攀岩联赛（贵阳站）前瞻特辑",
      location: "贵州 · 贵阳",
      startAt: "2024-07-28T16:00:00",
      coverUrl: "/covers/event-hero.svg",
      hasVideo: true,
      summary: "贵阳站前瞻特辑：场地探访与选手访谈。",
    },
    {
      title: "2023年攀岩国家队公开训练日集锦",
      location: "国家队训练基地",
      startAt: "2023-06-18T10:00:00",
      coverUrl: "/covers/karate.svg",
      hasVideo: true,
      summary: "国家队公开训练日实录，展示日常备战状态。",
    },
  ];

  const demoReplayUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  await prisma.schedule.createMany({
    data: [
      ...liveTitles.map((title, i) => ({
        title,
        location: "贵州省贵阳市 · 观山湖",
        startAt: new Date(liveStarts[i]),
        endAt: new Date(liveEnds[i]),
        streamId: liveStreamIds[i],
        coverUrl: liveCovers[i],
        sort: i + 1,
        isReplay: false,
      })),
      ...replayItems.map((item, i) => ({
        title: item.title,
        location: item.location,
        startAt: new Date(item.startAt),
        isReplay: true,
        coverUrl: item.coverUrl,
        replayUrl: item.hasVideo ? demoReplayUrl : "",
        summary: item.summary,
        content: `${item.summary}\n\n本专题由赛播云演示数据生成，可用于后台管理与前台展示联调。${
          item.hasVideo ? "点击播放器可观看演示录像。" : "本条为纯图文回顾，不含视频回放。"
        }`,
        sort: i + 1,
      })),
    ],
  });

  console.log(
    "Seed OK — admin / admin123 | 直播源 3 路（前 3 场直播已分别绑定）| 直播 10 + 往期 20",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
