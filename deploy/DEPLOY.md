# 赛播云 SportCast — 阿里云从零部署教程

本文面向 **刚买好的 ECS，系统是全新的、什么软件都没装、目录也没建** 的情况，按顺序做即可。

最终效果：

| 地址 | 说明 |
|------|------|
| `http://你的公网IP/` | 前台赛事门户 |
| `http://你的公网IP/admin` | 管理后台 |
| 账号 `admin` / 密码 `admin123` | 首次登录后请立刻改密码 |

推荐系统：**Ubuntu 22.04** 或 **Alibaba Cloud Linux 3**。下面命令以 **Ubuntu** 为主，Cloud Linux / CentOS 差异会单独标出。

---

## 总览：你一共要做这些事

```
① 控制台放行端口（安全组）
② SSH 登录服务器
③ 创建目录 /opt/sportcast
④ 安装 Node.js、PM2、Nginx
⑤ 把项目代码传到服务器
⑥ 写 .env 配置
⑦ 安装依赖、建库、构建、启动
⑧ 配置 Nginx，用浏览器访问验证
```

预计耗时：熟悉的话约 30～60 分钟（含上传代码时间）。

---

## 第 0 步：准备信息（在本地记下来）

在阿里云控制台「云服务器 ECS」里找到实例，记下：

| 信息 | 示例 | 你的值 |
|------|------|--------|
| 公网 IP | `47.xx.xx.xx` | ________ |
| 登录用户名 | Ubuntu 一般是 `root`；部分镜像是 `ecs-user` | ________ |
| 登录密码或密钥 | 购买时设置 / 可在控制台重置 | ________ |
| 系统 | Ubuntu 22.04 / Alibaba Cloud Linux 3 | ________ |

本机（Windows）建议准备：

- 能打开 **PowerShell** 或 **CMD**
- 可选：安装 [WinSCP](https://winscp.net/)（图形化传文件更轻松）

---

## 第 1 步：阿里云安全组放行端口（必须先做）

否则浏览器打不开网站，SSH 也可能连不上。

1. 打开 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/)
2. 点你的实例 → **安全组** → **配置规则** → **入方向** → **手动添加**
3. 至少添加这几条：

| 端口范围 | 授权对象 | 用途 |
|----------|----------|------|
| `22/22` | `0.0.0.0/0`（或仅你的办公 IP） | SSH 远程登录 |
| `80/80` | `0.0.0.0/0` | 网站 HTTP |
| `443/443` | `0.0.0.0/0` | 网站 HTTPS（以后要用） |

说明：应用本身跑在服务器内部的 `3000` 端口，**不必**对公网开放 3000；外面只走 80/443，由 Nginx 转发进去。

---

## 第 2 步：第一次 SSH 登录服务器

### 2.1 用 Windows PowerShell 登录

按下 `Win + X`，打开 **Windows PowerShell** 或 **终端**，执行（把 IP 换成你的）：

```powershell
ssh root@47.xx.xx.xx
```

- 第一次会问 `Are you sure you want to continue connecting`，输入 `yes` 回车
- 再输入密码（输入时屏幕上**不会显示字符**，属正常现象），回车

若用户名不是 `root`：

```powershell
ssh ecs-user@47.xx.xx.xx
```

登录成功后，提示符大致变成：

```text
root@iZxxxxx:~#
```

说明你已经在服务器里了。后面所有「在服务器上执行」的命令，都在这个窗口里敲。

### 2.2 看一下系统版本（确认自己是哪种系统）

```bash
cat /etc/os-release
```

关注 `NAME=` / `ID=`：

- 出现 `Ubuntu` → 后面用 **apt** 命令
- 出现 `Alibaba Cloud Linux` / `CentOS` / `Anolis` → 后面用 **yum** 命令

再看一眼磁盘和内存：

```bash
df -h
free -h
```

系统盘建议至少剩十几 GB 以上再部署。

---

## 第 3 步：创建项目目录（从零建好）

服务器刚买时，一般**没有** `/opt/sportcast`，需要自己建。

用 `root` 登录时，直接执行：

```bash
# 创建软件安装目录、备份目录、日志目录
mkdir -p /opt/sportcast
mkdir -p /opt/backup
mkdir -p /var/log/sportcast

# 看一眼是否创建成功
ls -la /opt
```

应能看到：

```text
sportcast/
backup/
```

如果当前不是 root，而是普通用户（如 `ecs-user`），用：

```bash
sudo mkdir -p /opt/sportcast /opt/backup
sudo chown -R $USER:$USER /opt/sportcast /opt/backup
ls -la /opt
```

进入项目目录（后面大部分命令都在这里执行）：

```bash
cd /opt/sportcast
pwd
# 应输出：/opt/sportcast
```

此时目录还是空的，正常。下一步先装环境，再传代码。

---

## 第 4 步：安装运行环境（Node / Git / Nginx / PM2）

下面分两种系统，**只执行与你系统匹配的那一段**。

### 4.A Ubuntu / Debian（推荐，命令用这一段）

```bash
# 更新软件源（第一次可能较慢）
apt-get update -y

# 安装基础工具、编译环境、Nginx、Git
apt-get install -y curl ca-certificates gnupg git build-essential nginx

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 pnpm（依赖管理）和 PM2（守护 Node 进程，关机重启后还能自动起来）
npm install -g pnpm pm2

# 开机自启 Nginx
systemctl enable nginx
systemctl start nginx
```

### 4.B Alibaba Cloud Linux / CentOS / 同类

```bash
yum install -y curl ca-certificates git gcc-c++ make nginx
# 若 yum 不可用可试：dnf install -y ...

curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

npm install -g pnpm pm2

systemctl enable nginx
systemctl start nginx
```

### 4.3 检查是否装成功（两种系统通用）

```bash
node -v
npm -v
pnpm -v
pm2 -v
nginx -v
git --version
```

期望类似：

```text
v20.x.x
10.x.x
5.x.x
nginx version: nginx/1.x.x
git version 2.x.x
```

若 `node -v` 报错 `command not found`，说明 Node 没装上，把上面安装段重新执行一遍，并把完整报错记下来。

> **说明：** 也可以在代码上传后再执行项目自带的 `sudo bash deploy/install-env.sh`，效果等价。新机器若还没代码，就按本节手动装。

---

## 第 5 步：把项目代码弄到服务器上

任选 **一种** 方式。**推荐方式 A（Git）**，以后日常只需 `bash deploy/up.sh` 即可拉最新代码并重启。

### 方式 A：有 Git 仓库（服务器直接拉，推荐）

在服务器上：

```bash
cd /opt
# 若 sportcast 是空目录，可先删掉空目录再克隆
rmdir /opt/sportcast 2>/dev/null || true

git clone https://github.com/ErHaSmile/SportCast.git sportcast
cd /opt/sportcast
# 去掉 Windows 换行符，避免脚本报错
sed -i 's/\r$//' deploy/*.sh
chmod +x deploy/*.sh
ls
```

应能看到 `package.json`、`src`、`prisma`、`deploy` 等。

### 方式 B：本机打包后上传（Windows 最常用）

#### B1. 在你自己的电脑上打包

打开项目所在目录，例如：

`D:\project\直播录播网站\sportcast`

**PowerShell：**

```powershell
cd "D:\project\直播录播网站\sportcast"

# 打包（不要带 node_modules、.next，体积会小很多，必须在服务器上重新安装）
tar --exclude=node_modules --exclude=.next --exclude=prisma/dev.db --exclude=prisma/dev.db-journal --exclude=.git -czf "$env:USERPROFILE\Desktop\sportcast.tar.gz" .
```

桌面上会出现 `sportcast.tar.gz`。

若本机没有 `tar` 命令，可：

1. 用 7-Zip / 资源管理器压缩整个项目
2. **务必删掉压缩包里的** `node_modules`、`.next` 文件夹后再传（或压缩前先不要选它们）

#### B2. 上传到服务器

**方法 1：PowerShell scp**

```powershell
scp "$env:USERPROFILE\Desktop\sportcast.tar.gz" root@47.xx.xx.xx:/opt/
```

**方法 2：WinSCP（图形界面）**

1. 打开 WinSCP，新建站点：协议 SFTP，主机名填公网 IP，用户名 `root`，密码同上
2. 登录后，右侧进到 `/opt`
3. 把桌面上的 `sportcast.tar.gz` 拖到右侧 `/opt`

#### B3. 在服务器上解压

```bash
cd /opt
# 确保目标目录存在
mkdir -p /opt/sportcast

# 解压到项目目录（注意包内是项目根文件，不是多套一层文件夹）
tar -xzf /opt/sportcast.tar.gz -C /opt/sportcast

# 检查
cd /opt/sportcast
ls
```

必须能看到：

```text
package.json
src/
prisma/
deploy/
next.config.ts
...
```

若看到多了一层，例如 `/opt/sportcast/sportcast/package.json`，把内层挪出来：

```bash
cd /opt/sportcast
# 若误套一层，按实际目录名调整
mv sportcast/* sportcast/.* . 2>/dev/null || true
rmdir sportcast 2>/dev/null || true
ls
```

#### B4. 修正脚本换行（从 Windows 上传时建议做）

```bash
cd /opt/sportcast
sed -i 's/\r$//' deploy/*.sh
chmod +x deploy/*.sh
ls -l deploy/
```

---

## 第 6 步：创建上传目录、写环境配置

```bash
cd /opt/sportcast

# 运行期需要的目录（上传图片/视频、PM2 日志）
mkdir -p public/uploads/videos
mkdir -p logs
mkdir -p prisma

# 生成生产环境配置
cp deploy/env.production.example .env

# 生成随机密钥
SECRET=$(openssl rand -hex 32)
echo "生成的 AUTH_SECRET=$SECRET"

# 写入 .env（也可手动 nano 编辑）
cat > .env <<EOF
DATABASE_URL="file:./prod.db"
AUTH_SECRET="$SECRET"
NODE_ENV="production"
PORT=3000
HOSTNAME=127.0.0.1
EOF

# 确认内容
cat .env
```

用编辑器手动改也可以：

```bash
nano .env
# 改完：Ctrl+O 回车保存，Ctrl+X 退出
```

### 6.1 对象存储（推荐：图片 / 回放视频走阿里云 OSS）

不配 OSS 时，上传仍写到服务器 `public/uploads`。配好后，后台新上传的封面、Logo、回放视频会存到 **私有** Bucket；网站访问时由服务器签发短时签名链接，别人拿到文件路径也无法长期随便下载。

1. 阿里云控制台创建 **OSS Bucket**（建议与 ECS 同地域，读写权限选 **私有**）。
2. 用 RAM 子账号创建 AccessKey，只授权该 Bucket（不要用主账号密钥）。
3. 把下面几行追加进 `/opt/sportcast/.env`（按你的实际值改）：

```bash
STORAGE_DRIVER=oss
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=你的Bucket名
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
# 同地域 ECS 建议走内网上传，省流量费（签名给浏览器仍走公网域名）
# OSS_ENDPOINT=oss-cn-hangzhou-internal.aliyuncs.com
# 若绑了 CDN / 自定义域名：
# OSS_PUBLIC_BASE=https://cdn.example.com
OSS_PREFIX=sportcast
# 签名有效期（秒），默认图片 2 小时、视频 6 小时
# OSS_SIGN_EXPIRES=7200
```

示例（上海 Bucket `sportcast1`）：

```bash
STORAGE_DRIVER=oss
OSS_REGION=oss-cn-shanghai
OSS_BUCKET=sportcast1
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
# OSS_ENDPOINT=oss-cn-shanghai-internal.aliyuncs.com
OSS_PREFIX=sportcast
```

4. 改完后重新构建并重启：`bash deploy/up.sh`（或只改了 `.env` 时：`pm2 restart sportcast --update-env`）。

---

## 第 7 步：安装依赖、初始化数据库、构建、启动

仍在 `/opt/sportcast`：

### 7.1 一键脚本（推荐）

```bash
cd /opt/sportcast
bash deploy/setup.sh
```

脚本会问是否写入示例数据，**第一次部署建议输入 `y`**，这样会有管理员账号和演示赛程。

然后启动：

```bash
bash deploy/start.sh
```

设置开机自启（很重要，重启服务器后网站才还在）：

```bash
pm2 save
pm2 startup
```

`pm2 startup` 会打印一行以 `sudo` 开头的命令，**原样复制再执行一次**。然后再：

```bash
pm2 save
```

### 7.2 若不想用脚本，可逐步手动执行

```bash
cd /opt/sportcast

pnpm install --frozen-lockfile

npx prisma generate
npx prisma migrate deploy

# 首次写入管理员 admin / admin123 和示例数据
pnpm db:seed

pnpm build

pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
# 按提示再执行那条 sudo 命令，然后 pm2 save
```

### 7.3 验证进程是否起来

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

`pm2 status` 里 `sportcast` 应为 **online**。  
`curl` 应返回 `HTTP/1.1 200` 或 `307` 之类，而不是 `Connection refused`。

看日志：

```bash
pm2 logs sportcast --lines 50
```

---

## 第 8 步：配置 Nginx（让外网通过 80 端口访问）

应用只监听本机 `127.0.0.1:3000`，需要 Nginx 对外提供 80 端口。

### 8.1 写入站点配置

把下面命令里的 `你的公网IP或域名` 换成真实值（例如 `47.98.xx.xx`）：

**Ubuntu（配置一般在 conf.d）：**

```bash
cp /opt/sportcast/deploy/nginx.sportcast.conf /etc/nginx/conf.d/sportcast.conf

# 修改 server_name
sed -i 's/your-domain.com/你的公网IP或域名/' /etc/nginx/conf.d/sportcast.conf

# 确认
grep server_name /etc/nginx/conf.d/sportcast.conf
```

也可用编辑器打开改：

```bash
nano /etc/nginx/conf.d/sportcast.conf
```

找到：

```nginx
server_name your-domain.com;
```

改成例如：

```nginx
server_name 47.98.xx.xx;
```

有域名则写成：

```nginx
server_name live.example.com;
```

### 8.2 若 Ubuntu 默认站点占了 80 端口

```bash
# 如有 default 站点，可先关掉避免冲突
rm -f /etc/nginx/sites-enabled/default
```

### 8.3 检查并重载 Nginx

```bash
nginx -t
systemctl enable nginx
systemctl reload nginx
# 若 reload 失败：
systemctl restart nginx
systemctl status nginx
```

`nginx -t` 必须显示 `syntax is ok` / `test is successful`。

### 8.4 本机防火墙（若开了防火墙才需要）

**Ubuntu（ufw）：**

```bash
ufw status
# 若显示 active：
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

**Cloud Linux / CentOS（firewalld）：**

```bash
systemctl status firewalld
# 若在运行：
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

很多阿里云镜像默认关着系统防火墙，只靠安全组即可；以 `ufw status` / `firewall-cmd` 实际结果为准。

---

## 第 9 步：浏览器验证

在你自己的电脑浏览器打开：

1. `http://你的公网IP/` → 应看到赛事门户首页  
2. `http://你的公网IP/admin` → 应看到登录页  
3. 使用 `admin` / `admin123` 登录后台  

若打不开：

1. 再确认安全组是否放行了 **80**
2. 服务器上执行：`curl -I http://127.0.0.1:3000` 与 `curl -I http://127.0.0.1/`
3. 看：`pm2 status`、`pm2 logs sportcast`、`systemctl status nginx`

---

## 第 10 步：上线后必做

1. **改后台密码**（默认太弱）  
2. 确认 `.env` 里的 `AUTH_SECRET` 已是随机串  
3. （可选）绑定域名：域名解析 A 记录指到公网 IP，再把 Nginx `server_name` 改成域名  
4. （可选）HTTPS：

```bash
# Ubuntu
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名
```

---

## 日常运维（部署好之后）

所有脚本在项目目录执行：

```bash
cd /opt/sportcast
```

| 操作 | 命令 |
|------|------|
| **一键拉代码并启动** | `bash deploy/up.sh` |
| 看状态 | `bash deploy/status.sh` |
| 重启（不拉代码） | `bash deploy/restart.sh` |
| 停止 | `bash deploy/stop.sh` |
| 启动（已构建过） | `bash deploy/start.sh` |
| 无 Git 时更新 | `SKIP_GIT=1 bash deploy/up.sh` |
| 看日志 | `pm2 logs sportcast --lines 100` |

### 日常发版（推荐）

服务器上只要这一条：

```bash
cd /opt/sportcast
bash deploy/up.sh
```

会自动：`git pull` → 装依赖 → 数据库迁移 → 构建 → PM2 启动/重启。  
首次部署请先配好 `.env`，并用 `git clone` 把仓库放到 `/opt/sportcast`（见上文传代码步骤）。

若 `git pull` 报连不上 `github.com:443`，先改镜像再更新：

```bash
cd /opt/sportcast
git remote set-url origin https://gitclone.com/github.com/ErHaSmile/SportCast.git
# 若仍失败可试：https://ghproxy.net/https://github.com/ErHaSmile/SportCast.git
bash deploy/up.sh
```

### 手动上传代码后的更新流程

1. 本机重新打包（同样排除 `node_modules`、`.next`）
2. 上传覆盖到 `/opt` 并解压到 `/opt/sportcast`
3. 服务器执行：

```bash
cd /opt/sportcast
sed -i 's/\r$//' deploy/*.sh
SKIP_GIT=1 bash deploy/up.sh
```

### 备份

```bash
mkdir -p /opt/backup
ts=$(date +%Y%m%d_%H%M%S)
tar -czf /opt/backup/sportcast_$ts.tar.gz \
  -C /opt/sportcast prisma/prod.db public/uploads .env
ls -lh /opt/backup
```

建议定期把 `/opt/backup` 里的包再下载到自己电脑。

---

## 服务器上最终目录长什么样

```text
/opt/
├── backup/                 # 你放备份的地方
└── sportcast/              # 项目根目录
    ├── .env                # 生产配置（不要发给别人）
    ├── package.json
    ├── node_modules/       # pnpm 安装生成
    ├── .next/              # build 生成
    ├── logs/               # PM2 日志
    ├── deploy/             # 部署脚本与文档
    ├── prisma/
    │   └── prod.db         # 生产数据库
    ├── public/
    │   └── uploads/        # 封面、回放视频
    │       └── videos/
    └── src/
```

---

## 常见问题排查

### 1）浏览器一直打不开，但 `curl 127.0.0.1:3000` 正常

- 多半是 **安全组没放行 80**，或 Nginx 没起来  
- 检查：`systemctl status nginx`、`nginx -t`  
- 控制台安全组再核对一遍

### 2）`Connection refused` / pm2 里 sportcast 是 errored

```bash
pm2 logs sportcast --lines 100
cd /opt/sportcast && cat .env
ls -la prisma/
```

常见原因：没 build、`.env` 缺失、依赖没装全。重新跑：

```bash
cd /opt/sportcast
bash deploy/setup.sh
bash deploy/restart.sh
```

### 3）上传视频报 413 或失败

确认 Nginx 里有：

```nginx
client_max_body_size 210m;
```

改完后：`nginx -t && systemctl reload nginx`

### 4）从 Windows 拷了 `node_modules` 导致构建失败

删掉后在服务器重装：

```bash
cd /opt/sportcast
rm -rf node_modules .next
pnpm install --frozen-lockfile
pnpm build
bash deploy/restart.sh
```

### 5）脚本报 `$'\r': command not found`

换行符问题：

```bash
sed -i 's/\r$//' /opt/sportcast/deploy/*.sh
```

### 6）重启云主机后网站没了

```bash
pm2 status
# 若列表空：
cd /opt/sportcast
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
systemctl start nginx
```

---

## 附录：一张「复制粘贴」速查（Ubuntu + 已上传代码）

适合你已经完成「安全组 + SSH + 代码已在 `/opt/sportcast`」之后，一口气跑完：

```bash
# —— 环境 ——
apt-get update -y
apt-get install -y curl ca-certificates gnupg git build-essential nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2
systemctl enable nginx && systemctl start nginx

# —— 项目 ——
cd /opt/sportcast
sed -i 's/\r$//' deploy/*.sh
chmod +x deploy/*.sh
mkdir -p public/uploads/videos logs prisma
cp -n deploy/env.production.example .env
# 请务必编辑 AUTH_SECRET：
nano .env

bash deploy/setup.sh      # 首次 seed 选 y
bash deploy/start.sh
pm2 save
pm2 startup               # 再执行它提示的那条 sudo 命令
pm2 save

# —— Nginx ——
cp deploy/nginx.sportcast.conf /etc/nginx/conf.d/sportcast.conf
nano /etc/nginx/conf.d/sportcast.conf   # 改 server_name
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# —— 验证 ——
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1/
pm2 status
```

然后浏览器打开：`http://公网IP/` 与 `http://公网IP/admin`。

---

更短的脚本说明见同目录各 `.sh` 文件头部注释；环境变量模板见 `env.production.example`。
