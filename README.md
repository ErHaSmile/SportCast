# 赛播云 SportCast

赛事直播 / 录播管理系统：前台专题站 + 管理后台。

## 技术栈

- Next.js（App Router）+ TypeScript
- Prisma + SQLite
- Ant Design（后台）
- hls.js（播放器，下一步接入）

## 快速开始

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin
- 默认账号：`admin` / `admin123`

## 当前进度（脚手架）

- [x] 项目初始化、数据模型、登录鉴权
- [x] 后台壳（侧栏导航 + 概览）
- [x] 直播源列表接口（只读列表页）
- [x] 前台专题占位页 + 后台预览 iframe
- [ ] 直播源增删改 / 启停
- [ ] 赛程管理
- [ ] 素材上传
- [ ] 操作日志列表
- [ ] 前台播放器（HLS / H5）

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run db:migrate` | 数据库迁移 |
| `npm run db:seed` | 写入默认管理员与示例数据 |
| `npm run db:reset` | 重置数据库并重新 seed |

## 生产部署（阿里云）

**新买的服务器（啥都没装）请直接按逐步教程操作：**  
**[deploy/DEPLOY.md](deploy/DEPLOY.md)**（含建目录、装环境、传代码、Nginx、开机自启）。

代码已就位后的常用命令：

```bash
sudo bash deploy/install-env.sh   # 安装 Node / PM2 / Nginx
cp deploy/env.production.example .env
bash deploy/setup.sh              # 依赖 + 库表 + 构建
bash deploy/start.sh              # PM2 启动
```
