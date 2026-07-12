# 🚀 个人主页搭建指南

> 面向全栈新手的零基础到上线完整教程，每一步都有详细说明。
>
> **预计总耗时**：1-2 小时（不含域名购买）
> **总花费**：0 元（Supabase 免费额度 + GitHub Pages 免费，域名另计）

---

## 目录

- [开始之前：了解你的项目](#开始之前了解你的项目)
- [第 0 步：准备工作（5 分钟）](#第-0-步准备工作)
- [第 1 步：创建 Supabase 后端（20 分钟）](#第-1-步创建-supabase-后端)
- [第 2 步：配置本地环境 + 首次运行（10 分钟）](#第-2-步配置本地环境--首次运行)
- [第 3 步：初始化文章数据（可选，5 分钟）](#第-3-步初始化文章数据)
- [第 4 步：部署到 GitHub Pages（20 分钟）](#第-4-步部署到-github-pages)
- [第 5 步：绑定自定义域名（15 分钟）](#第-5 步绑定自定义域名)
- [第 6 步：首次登录管理后台（5 分钟）](#第-6 步首次登录管理后台)
- [日常使用指南](#日常使用指南)
- [常见问题排查](#常见问题排查)

---

## 开始之前：了解你的项目

### 这个项目是什么？

一个可以直接部署在 GitHub Pages（免费静态托管）上的**二次元风格个人主页**，加上一个**受密码保护的图形化编辑器后台**。你的主页看起来像一个动画精美的个人博客，而你可以通过浏览器登录后台来修改主页的每一个元素——换背景图、改光标特效、写文章、上传图片，**全部不需要写代码**。

### 它是怎么工作的？

```
你访问 yourname.com
        │
        ▼
  GitHub Pages 返回 HTML/JS/CSS（静态文件）
        │
        ▼
  网页在浏览器中运行，JavaScript 从 Supabase 云端数据库加载内容
  （头像、文章、背景配置等）
        │
        ▼
  渲染出漂亮的页面

你访问 yourname.com/admin/login
        │
        ▼
  输入邮箱密码 → Supabase 验证身份
        │
        ▼
  进入图形化编辑器 → 修改背景/写文章/传图片
        │
        ▼
  点击保存 → 数据写回 Supabase → 主页自动显示新内容
```

三个关键角色的分工：

| 角色 | 做什么 | 花多少钱 |
|------|--------|---------|
| **GitHub Pages** | 托管网页文件（HTML/JS/CSS） | 免费 |
| **Supabase** | 云端数据库 + 用户登录 + 文件存储 | 免费（500MB 内）|
| **你的域名** | 让外界用个性网址访问 | ~50 元/年 |


---

## 第 0 步：准备工作

开始前，请确保你有以下工具：

### 0.1 注册 GitHub 账号

如果还没有，去 [github.com](https://github.com) 注册一个。**用户名建议用英文**，因为你的默认域名会是 `你的用户名.github.io`。

### 0.2 安装 Node.js（本地测试用）

1. 打开 [nodejs.org](https://nodejs.org)
2. 下载 **LTS 版本**（左边绿色的大按钮），推荐 18.x 或 20.x
3. 安装时一路点"下一步"即可

安装完成后验证：

```bash
# 打开终端（Windows 按 Win+R 输入 cmd，Mac 打开 Terminal）
node --version   # 应显示 v18.x.x 或 v20.x.x
npm --version    # 应显示 9.x.x 或 10.x.x
```

### 0.3 安装 Git

- **Windows**：[git-scm.com](https://git-scm.com) 下载安装
- **Mac**：终端输入 `xcode-select --install`

验证：

```bash
git --version    # 应显示 git version 2.x.x
```

### 0.4（可选但推荐）安装 VS Code

从 [code.visualstudio.com](https://code.visualstudio.com) 下载。这是我们编辑代码的 IDE，你修改环境变量时会用到。


---

## 第 1 步：创建 Supabase 后端

Supabase 是你网站的"大脑"——存储所有内容、验证你的管理员身份、存放上传的图片/视频。

### 1.1 注册 Supabase

1. 打开 [supabase.com](https://supabase.com)
2. 点击右上角 **"Start your project"**
3. 选择 **"Sign in with GitHub"**（用 GitHub 账号登录最方便）
4. 授权登录

### 1.2 创建项目

1. 登录后进入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **"New project"**（黄色大按钮）
3. 填写表单：

| 字段 | 填什么 | 说明 |
|------|--------|------|
| **Name** | `my-homepage` | 随便起名 |
| **Database Password** | 点击 **"Generate a password"** | **⚠️ 务必保存这个密码！**后面不会再次显示 |
| **Region** | 选离你最近的 | 国内用户选 `ap-southeast-1`（新加坡）或 `ap-northeast-1`（东京） |

4. 点击 **"Create new project"**，等待 1-2 分钟初始化

### 1.3 获取 API 密钥

项目创建完成后，你需要拿到两个"钥匙"让网页能连接到数据库：

1. 在左侧菜单点击 **⚙️ Settings** → **API**（或直接点左侧的齿轮图标）
2. 你会看到：
   - **Project URL**：类似 `https://abcdefghijklm.supabase.co`
   - **anon public key**：一长串以 `eyJ` 开头的字符串

> **把这两个值复制到记事本里，后面会用到！**

> 🔒 **安全提示**：`anon public key` 可以公开（它受到数据库安全策略的保护）。但 `service_role key` 是超级密钥，**绝对不能**给别人看或放在网页代码里。我们只用 `anon key`。

### 1.4 创建数据库表

数据库表就像 Excel 表格，用来存你的主页配置、文章、资源信息。你需要复制建表 SQL 到 Supabase 的 SQL Editor 中执行。

1. 在左侧菜单点击 **🗄️ SQL Editor**（SQL 编辑器）
2. 点击 **"New query"**（新建查询）
3. **清空输入框**，然后把下面整段代码**全部复制**粘贴进去：

```sql
-- ============================================
-- 1. 页面配置表（存背景、光标、音乐等所有设置）
-- ============================================
CREATE TABLE page_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section       TEXT NOT NULL,
  key           TEXT NOT NULL,
  value         JSONB NOT NULL,
  label         TEXT,
  description   TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, key)
);

CREATE INDEX idx_page_config_section ON page_config(section);
CREATE INDEX idx_page_config_active ON page_config(is_active);

ALTER TABLE page_config ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "public_read" ON page_config FOR SELECT USING (true);
-- 仅登录用户可写
CREATE POLICY "authenticated_write" ON page_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "authenticated_update" ON page_config FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_delete" ON page_config FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 2. 文章表（博客内容）
-- ============================================
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  content       TEXT NOT NULL,
  excerpt       TEXT,
  cover_url     TEXT,
  tags          TEXT[] DEFAULT '{}',
  category      TEXT DEFAULT '未分类',
  is_published  BOOLEAN DEFAULT false,
  is_top        BOOLEAN DEFAULT false,
  view_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(is_published);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published" ON posts FOR SELECT USING (is_published = true);
CREATE POLICY "authenticated_all" ON posts FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 3. 资源表（图片/视频/音频元数据）
-- ============================================
CREATE TABLE assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  category      TEXT NOT NULL,
  size_bytes    BIGINT,
  width         INTEGER,
  height        INTEGER,
  tags          TEXT[] DEFAULT '{}',
  description   TEXT,
  usage_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_created ON assets(created_at DESC);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON assets FOR SELECT USING (true);
CREATE POLICY "authenticated_all" ON assets FOR ALL USING (auth.role() = 'authenticated');
```

4. 点击右下角绿色 **"Run"** 按钮
5. 你应该看到 `Results: Success. No rows returned.`——这说明表创建成功！

> **如何确认成功？** 点击左侧菜单的 **🗄️ Table Editor**（表编辑器），应该能看到 `page_config`、`posts`、`assets` 三张表。

### 1.5 创建云存储空间

存储空间用来放你上传的图片、视频、音乐文件。

1. 在左侧菜单点击 **📦 Storage**
2. 点击 **"New bucket"**
3. 名称填 `public-assets`
4. **⚠️ 重要：** 勾选 **"Public bucket"**（公开桶，这样图片才能被外界访问到）
5. 点击 **"Save"**

然后设置存储的安全策略。点击 **SQL Editor** → **New query**，粘贴下面代码并点 **Run**：

```sql
-- Storage 访问策略
CREATE POLICY "public_read_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');

CREATE POLICY "authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'public-assets' AND auth.role() = 'authenticated');

CREATE POLICY "authenticated_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
```

### 1.6 创建你的管理员账号

管理员账号用来登录后台编辑器。**Supabase 不开放公开注册**，你需要在后台手动创建。

1. 在左侧菜单点击 **🔑 Authentication** → **Users**
2. 点击 **"Add user"** → **"Create new user"**
3. 填写：

| 字段 | 填什么 |
|------|--------|
| **Email** | 你的邮箱（如 `admin@example.com`） |
| **Password** | 设置一个**强密码**（至少 8 位，含大小写字母+数字） |
| **Auto Confirm User** | ✅ **勾选**（否则需要邮箱验证） |

4. 点击 **"Create user"**

> ⚠️ **记住这个邮箱和密码**，这是你登录后台编辑器的唯一凭证！

### 1.7 关闭公开注册（安全加固）

1. 在左侧菜单点击 **🔑 Authentication** → **Settings**
2. 往下滚动到 **"Email Auth"** 部分
3. 把 **"Enable sign-ups"** 的开关**关掉**
4. 点击页面底部的 **"Save"**

> 这样只有你手动在后台创建的用户才能登录，外面的人无法自己注册。

---

## 第 2 步：配置本地环境 + 首次运行

### 2.1 找到你的项目文件夹

你的项目代码已经在 `/data/chenhaoran/docs/MainPage/` 目录下。如果你把这个文件夹复制到了别的地方：

```bash
# 假设你把它复制到了桌面
cd ~/Desktop/MainPage
```

### 2.2 用 VS Code 打开项目

```bash
code .
```

或者直接打开 VS Code → File → Open Folder → 选择 `MainPage` 文件夹。

### 2.3 配置环境变量

在 VS Code 中打开 `.env.production` 文件（根目录下），把内容改成你的 Supabase 信息：

```bash
# 之前你记在记事本里的两个值：
VUE_APP_SUPABASE_URL=https://你的项目ID.supabase.co
VUE_APP_SUPABASE_ANON_KEY=你的anon key（eyJ开头那串）
```

**示例**（这是假的，请用你自己的）：

```bash
VUE_APP_SUPABASE_URL=https://abcdefghijklm.supabase.co
VUE_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

同时也编辑 `.env.development`，内容一样即可（开发和生产环境可以共用同一套）。

### 2.4 本地运行测试

回到终端，确保你在项目文件夹中，然后：

```bash
# 安装依赖（第一次需要，约 2-3 分钟）
npm install

# 启动开发服务器
npm run chaichai
```

如果一切正常，你会看到：

```
  App running at:
  - Local:   http://localhost:8080/
```

打开浏览器访问 **http://localhost:8080**，你应该能看到带打字机效果的首页！

如果看到页面但内容不对（头像缺失等），这是正常的——因为数据库里还没有配置数据。登录后台编辑后就能看到效果了。

### 2.5 验证管理后台登录

1. 浏览器打开 **http://localhost:8080/admin/login**
2. 输入你在 1.6 步创建的邮箱和密码
3. 点击登录——应该能成功进入仪表盘

> ❓ 如果登录报错，检查 `.env.development` 中的 Supabase URL 和 Key 是否正确。

---

## 第 3 步：初始化文章数据

此时你的主页数据是空的——数据库里有表但没有数据。你可以先写一篇文章测试。

1. 登录后台 **http://localhost:8080/admin/login**
2. 点击左侧 **📄 文章管理** → **新建文章**
3. 填写标题和内容（富文本编辑器）→ 点击 **发布文章**
4. 回到主页 **http://localhost:8080/blog**，你应该能看到发布的文章

---

## 第 4 步：部署到 GitHub Pages

前面都是在本地运行的，现在让网站上线。

### 4.1 创建 GitHub 仓库

1. 打开 [github.com/new](https://github.com/new)
2. 填写：

| 字段 | 填什么 |
|------|--------|
| **Repository name** | `my-homepage`（或你喜欢的名字） |
| **Description** | 可选，如"我的个人主页" |
| **Public / Private** | 选 **Public**（公开，GitHub Pages 免费） |

3. **不要**勾选 "Add a README file"、"Add .gitignore"、"Choose a license"
4. 点击 **"Create repository"**

### 4.2 推送代码到 GitHub

GitHub 会显示一个命令行指引，选择第二组（"push an existing repository"）。在终端中执行：

```bash
# 确保在项目目录下
cd /data/chenhaoran/docs/MainPage

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建第一个提交
git commit -m "初始化个人主页项目"

# 关联远程仓库（替换成你自己的仓库地址）
git remote add origin https://github.com/你的用户名/my-homepage.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 4.3 配置 GitHub Actions Secrets

GitHub Actions 是自动构建工具——你推送代码后它会自动编译并部署。但它需要知道你的 Supabase 连接信息。

1. 打开你的 GitHub 仓库页面
2. 点击 **Settings** → 左侧 **Secrets and variables** → **Actions**
3. 点击 **"New repository secret"**，添加两个 secret：

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://你的项目ID.supabase.co` |
| `SUPABASE_ANON_KEY` | `你的 anon key（eyJ开头那串）` |

> 这两个值和 `.env.production` 中的完全一样。

4. 添加完成后，你的 Secrets 页面应该有这两个条目。

### 4.4 触发自动部署

1. 编辑 `.github/workflows/deploy.yml` 文件，把第 37 行的 `your-domain.com` 改成你的 GitHub Pages 默认域名：

```yaml
# 改这一行：
- name: Create CNAME
  run: echo '你的用户名.github.io' > dist/CNAME
```

2. 提交并推送：

```bash
git add .github/workflows/deploy.yml
git commit -m "更新 CNAME 配置"
git push
```

3. 打开 GitHub 仓库页面，点击 **Actions** 标签——你会看到一个正在运行的工作流（黄色圆圈）。
4. 等它变成**绿色对勾** ✅（约 2 分钟），说明部署成功。

### 4.5 启用 GitHub Pages

1. 在仓库页面点击 **Settings** → 左侧 **Pages**
2. **Source** 选择 **"Deploy from a branch"**
3. **Branch** 选择 `gh-pages`，目录选 `/ (root)`
4. 点击 **Save**
5. 等待 1-2 分钟，页面上方会显示：`Your site is live at https://你的用户名.github.io`

点击这个链接——你的主页上线了！🎉

### 4.6 验证线上后台

1. 浏览器打开 `https://你的用户名.github.io/admin/login`
2. 用你的管理员邮箱和密码登录
3. 编辑背景 → 保存 → 回到首页看效果

> ❓ 如果线上登录报错，检查 GitHub Actions Secrets 是否正确配置。


---

## 第 5 步：绑定自定义域名

用 `你的用户名.github.io` 不够酷？绑个自己的域名。

### 5.1 购买域名

推荐的域名注册商：

| 平台 | 价格参考 | 特点 |
|------|---------|------|
| [Cloudflare Registrar](https://cloudflare.com) | 按进价（约 $8-12/年） | 最实惠，自带 CDN |
| [Namecheap](https://namecheap.com) | $10-15/年 | 老牌注册商 |
| 阿里云万网 | ¥50-80/年 | 国内用户方便 |

搜一个你喜欢的域名，买下来即可（如 `yourname.com`）。

### 5.2 配置 DNS（推荐 Cloudflare）

以 Cloudflare 为例（其他平台的原理一样）：

1. 在 Cloudflare 中添加你的域名（按指引操作）
2. 进入域名管理 → **DNS** → **Records**
3. 添加一条记录：

| 字段 | 值 |
|------|-----|
| 类型 | **CNAME** |
| 名称 | `@`（或留空，表示裸域） |
| 目标 | `你的用户名.github.io` |
| TTL | 自动 |

如果你用 `www.你的域名.com` 作为主域名：

| 字段 | 值 |
|------|-----|
| 类型 | **CNAME** |
| 名称 | `www` |
| 目标 | `你的用户名.github.io` |

4. 如果你的注册商不支持 CNAME 裸域（`@`），可以添加 A 记录（GitHub 的 IP）：

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### 5.3 在 GitHub 中绑定

1. 更新 `.github/workflows/deploy.yml` 中的 CNAME：

```yaml
- name: Create CNAME
  run: echo '你的域名.com' > dist/CNAME
```

2. 提交推送：

```bash
git add .github/workflows/deploy.yml
git commit -m "绑定自定义域名"
git push
```

3. 等待 Actions 完成，然后去仓库 **Settings** → **Pages** → **Custom domain** 填入你的域名 → 点击 **Save**
4. 勾选 **"Enforce HTTPS"**（可能需要等几分钟才能选中）

### 5.4 等待生效

DNS 变更最长需要 48 小时，但通常 **5-30 分钟**就生效了。在浏览器输入你的域名，看到主页即成功。

可在 [whatsmydns.net](https://www.whatsmydns.net) 查询 DNS 传播状态。


---

## 第 6 步：首次登录管理后台

上线后，你可以通过浏览器在任何地方管理你的主页。

### 6.1 登录

访问 `https://你的域名.com/admin/login`，输入你的管理员邮箱和密码。

### 6.2 第一次配置建议

登录后建议按以下顺序配置，每配置一项就点"保存"：

1. **⚙️ 全局设置** → 改网站标题、版权信息
2. **🌄 动态背景** → 选一个背景类型（可以先上传自己的图到资源管理）
3. **📝 首页内容** → 改头像 URL、作者名、打字机文本
4. **🏠 Banner** → 改导航菜单和友链
5. **🖱️ 鼠标指针** → 试试拖尾或发光特效

### 6.3 写第一篇文章

1. 点击 **📄 文章管理** → **新建文章**
2. 输入标题，用富文本编辑器写正文
3. 分类填"技术"或"生活"等，标签用逗号分隔
4. 点击 **发布文章**
5. 回到主页 **/blog**，你的文章出现了

### 6.4 上传图片等资源

1. 点击 **🖼️ 资源管理**
2. 拖拽图片/视频到上传区域
3. 上传后可以在各个编辑器中通过"选择资源"按钮引用

---

## 日常使用指南

### 日常操作速查

| 想做什么 | 去哪里 |
|---------|--------|
| 换背景图 | 后台 → 页面编辑器 → 动态背景 |
| 改光标特效 | 后台 → 页面编辑器 → 鼠标指针 |
| 写博客 | 后台 → 文章管理 → 新建文章 |
| 传图片 | 后台 → 资源管理 → 拖拽上传 |
| 改自我介绍 | 后台 → 页面编辑器 → 首页内容 |
| 添加友链 | 后台 → 页面编辑器 → Banner |
| 改网页标题 | 后台 → 全局设置 |
| 换音乐 | 后台 → 页面编辑器 → 背景音乐 |

### 工作流程

```
想修改主页某个元素
    │
    ▼
打开 https://你的域名.com/admin
    │
    ▼
登录 → 进入对应编辑器 → 修改 → 保存
    │
    ▼
刷新主页（https://你的域名.com）
    │
    ▼
看到效果 ✓
```

### 安全建议

1. **不要分享管理员密码**给任何人
2. 定期在 Supabase Dashboard 检查数据库用量（免费额 500MB）
3. GitHub 仓库设为 **Public** 没问题——代码里没有密钥，密钥在 GitHub Secrets 和 Supabase 中
4. 如果怀疑密码泄露，去 Supabase → Authentication → Users → 修改密码

### 更新项目代码

以后如果想更新功能（比如我修复了 bug），只需：

```bash
cd /data/chenhaoran/docs/MainPage
git pull origin main
# 安装可能的新依赖
npm install
# 本地测试一下
npm run chaichai
# 确认无误后推送部署
git add .
git commit -m "更新xxx"
git push
```

---

## 常见问题排查

### ❓ 主页打开是空白的 / 没有内容

**原因**：Supabase 数据库里没有配置数据，或者环境变量配错了。

**解决**：
1. 确认 `.env.production` 中的 `VUE_APP_SUPABASE_URL` 和 `VUE_APP_SUPABASE_ANON_KEY` 正确
2. 确认 GitHub Actions Secrets 中同样的值也正确配置了
3. 登录管理后台，进入"页面编辑器"各页面，手动保存一次配置

### ❓ 登录后台报错 "邮箱或密码错误"

**原因**：
1. 密码确实错了
2. 环境变量中的 Supabase URL/Key 不对

**解决**：
1. 确认 `.env` 文件和 GitHub Secrets 中的 Supabase URL 和 anon key 正确
2. 去 Supabase → Authentication → Users → 点你的用户 → 重置密码

### ❓ 上传图片失败

**原因**：
1. Storage Bucket 没创建或不是 Public
2. Storage 的 RLS 策略没执行

**解决**：
1. 去 Supabase → Storage → 确认有 `public-assets` bucket，且旁边的锁图标显示"Public"
2. 在 SQL Editor 中重新执行第 1.5 步的 Storage 策略 SQL

### ❓ GitHub Actions 构建失败

**原因**：通常是 Secrets 没配置或代码有错误。

**解决**：
1. 去仓库 Actions 页面，点失败的构建 → 查看日志
2. 如果日志显示 `VUE_APP_SUPABASE_URL is not defined`，说明 Secrets 没配好
3. 如果是其他错误，把日志贴给我分析

### ❓ 自定义域名访问 404

**原因**：DNS 还没生效，或 CNAME 配错了。

**解决**：
1. 等 10-30 分钟再试
2. 用 [whatsmydns.net](https://www.whatsmydns.net) 查你的域名 DNS 是否指向了 GitHub
3. 如果过了 2 小时还不行，检查域名注册商那里的 DNS 设置

### ❓ 页面刷新后 404（SPA 路由问题）

**原因**：GitHub Pages 不支持 Vue Router 的 history 模式。

**解决**：已内置处理——`gh-pages` 分支中包含了 `404.html`，它会自动将 404 页面重定向到主页。

### ❓ 修改编辑器内容后主页没变化

**解决**：
1. 确认你在编辑器中点击了"保存配置"按钮
2. 刷新主页（Ctrl+F5 强制刷新，清除缓存）
3. 等待 5-10 秒（数据库写入有微小延迟）

### ❓ 忘记了管理员密码

**解决**：
1. 登录 Supabase Dashboard → Authentication → Users
2. 找到你的用户 → 点击右侧三个点 → **"Send password reset"** 或直接编辑密码

---

## 下一步

恭喜！你的个人主页已经上线了 🎉

接下来你可以：

- 在管理后台里玩遍每个编辑器，把主页变成你想要的样子
- 写几篇博客文章
- 上传自己的背景图片和头像
- 邀请朋友访问你的域名

遇到任何问题，随时回来查阅这份指南或联系我。

---

> 📖 技术细节参见 [architecture.md](architecture.md)
> 📝 最后更新：2026-07-13
