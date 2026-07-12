# 个人主页架构文档

> **项目名称**: 二次元个人博客 + 图形化页面编辑器
> **版本**: v1.0.0
> **架构模式**: Jamstack (静态前端 + BaaS 云后端)
> **托管平台**: GitHub Pages + 自定义域名

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构总览](#2-技术架构总览)
3. [目录结构](#3-目录结构)
4. [数据库设计](#4-数据库设计)
5. [接口与数据链路](#5-接口与数据链路)
6. [鉴权体系](#6-鉴权体系)
7. [路由设计](#7-路由设计)
8. [组件树与页面结构](#8-组件树与页面结构)
9. [数据流与交互逻辑](#9-数据流与交互逻辑)
10. [功能清单](#10-功能清单)
11. [图形化编辑器设计](#11-图形化编辑器设计)
12. [部署架构](#12-部署架构)
13. [自定义域名配置](#13-自定义域名配置)
14. [实施任务拆解](#14-实施任务拆解)
15. [附录](#15-附录)

---

## 1. 项目概述

### 1.1 项目目标

基于 Vue 2 二次元个人博客模板，构建一个部署在 GitHub Pages 上的个人主页，具备以下能力：

1. **公开展示页**：继承模板的全部视觉效果（动态背景、打字机动画、Markdown 渲染、Banner 导航等），内容从云端数据库动态加载。
2. **受保护的图形化编辑器**：通过 `/admin` 路径访问，需账号密码登录，提供可视化界面用于增删查改主页的所有内容和元素。
3. **资源管理器**：上传、浏览、删除图片/视频/音频等媒体资源。

### 1.2 核心约束

| 约束项 | 说明 |
|--------|------|
| **静态托管** | GitHub Pages 仅支持静态文件（HTML/CSS/JS），无服务端执行环境 |
| **Vue 版本** | 模板基于 Vue 2.6，需保持兼容，不做 Vue 3 迁移 |
| **UI 框架** | 模板使用 Element UI 2.x，编辑器复用同一 UI 体系 |
| **自定义域名** | 需支持绑定用户购买的独立域名 + HTTPS |

### 1.3 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 后端服务 | Supabase (BaaS) | 无需自建服务器，提供 Auth + DB + Storage 全套能力 |
| 数据库 | PostgreSQL + JSONB | 关系型查询强于 NoSQL；JSONB 允许灵活存储各类页面配置 |
| 编辑器 | Vue 2 SPA（独立路由段） | 与主页共享组件和样式体系，减少代码量 |
| 资源存储 | Supabase Storage (S3 兼容) | 自带 CDN、公开访问策略、免费额度充足 |
| CI/CD | GitHub Actions | 推送即构建，零运维 |

---

## 2. 技术架构总览

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                        GitHub Pages                               │
│                     https://your-domain.com                       │
│                                                                  │
│  ┌───────────────────────────┐  ┌──────────────────────────────┐ │
│  │      公开主页 SPA (/)      │  │    图形化编辑器 SPA (/admin)   │ │
│  │                           │  │                              │ │
│  │  Vue 2.6 + Vue Router     │  │  Vue 2.6 + Vue Router        │ │
│  │  Element UI 2.x           │  │  Element UI 2.x              │ │
│  │  SCSS + Animate.css       │  │  SCSS + Element Tiptap       │ │
│  │  Supabase JS SDK (只读)    │  │  Supabase JS SDK (读写)      │ │
│  │                           │  │  + Supabase Auth (登录鉴权)   │ │
│  └─────────────┬─────────────┘  └───────────────┬──────────────┘ │
│                │                                 │                │
└────────────────┼─────────────────────────────────┼────────────────┘
                 │         HTTPS (JS SDK)          │
                 ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Supabase 云服务                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  Auth       │  │  PostgreSQL 数据库    │  │  Storage 存储    │ │
│  │             │  │                      │  │                  │ │
│  │ · 邮箱/密码  │  │  · page_config (配置) │  │  · images/       │ │
│  │ · JWT 令牌  │  │  · assets (资源元数据) │  │  · videos/       │ │
│  │ · RLS 策略  │  │  · posts (博客内容)    │  │  · audio/        │ │
│  │ · 行级安全  │  │  · profiles (用户)     │  │  · custom/       │ │
│  └─────────────┘  └──────────────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈清单

| 层 | 技术 | 版本 | 用途 |
|---|------|------|------|
| **前端框架** | Vue | 2.6.14 | SPA 框架 |
| **路由** | Vue Router | 3.5.1 | 前端路由 |
| **UI 组件库** | Element UI | 2.15.10 | 表单、按钮、对话框等 |
| **富文本编辑器** | Element Tiptap | 1.27.1 | 博客文章编辑 |
| **CSS 预处理** | SCSS (sass) | 1.32.7 | 样式编写 |
| **动画** | Animate.css | 4.1.1 | 页面过渡动画 |
| **Markdown 渲染** | vue-markdown / highlight.js | - | 文章内容渲染 |
| **BaaS** | Supabase | - | 认证 + 数据库 + 存储 |
| **Supabase SDK** | @supabase/supabase-js | ^2.x | 浏览器端 JS SDK |
| **构建工具** | Vue CLI | 5.x | 项目构建 |
| **托管** | GitHub Pages | - | 静态网站托管 |
| **CI/CD** | GitHub Actions | - | 自动构建部署 |
| **域名** | 自定义域名 + Cloudflare DNS | - | 个性域名 + HTTPS |

---

## 3. 目录结构

```
MainPage/
├── public/
│   ├── index.html                 # HTML 入口
│   ├── favicon.ico
│   ├── CNAME                      # 自定义域名配置（your-domain.com）
│   └── 404.html                   # GitHub Pages 自定义 404
│
├── src/
│   ├── main.js                    # Vue 入口，注册插件
│   ├── App.vue                    # 根组件
│   │
│   ├── router/
│   │   └── index.js               # 路由配置（公开页 + 管理后台）
│   │
│   ├── config/
│   │   └── supabase.js            # Supabase 客户端初始化（单例）
│   │
│   ├── stores/                    # 简易状态管理（全局数据缓存）
│   │   ├── pageConfig.js          # 页面配置缓存（响应式）
│   │   └── auth.js                # 鉴权状态管理
│   │
│   ├── services/                  # 数据访问层（封装 Supabase 调用）
│   │   ├── pageConfigService.js   # page_config 表 CRUD
│   │   ├── postsService.js        # posts 表 CRUD
│   │   ├── assetsService.js       # assets 表 + Storage CRUD
│   │   └── authService.js         # 登录/登出/session 管理
│   │
│   ├── mixins/
│   │   └── authGuard.js           # 路由守卫 mixin（检查登录态）
│   │
│   ├── views/
│   │   ├── public/                # 【公开页面】
│   │   │   ├── HomeView/
│   │   │   │   ├── HomeView.vue          # 首页（头像 + 打字机 + 导航）
│   │   │   │   ├── components/
│   │   │   │   │   └── typewriter.vue    # 打字机效果组件
│   │   │   │   └── css/
│   │   │   │       └── HomeView.scss
│   │   │   ├── FirstView/
│   │   │   │   ├── FirstView.vue         # 关于页（Banner + Markdown 内容）
│   │   │   │   └── css/
│   │   │   │       └── FirstView.scss
│   │   │   ├── BlogView/
│   │   │   │   ├── BlogView.vue          # 博客列表页
│   │   │   │   └── components/
│   │   │   │       ├── bannerList1.vue
│   │   │   │       ├── bannerList2.vue
│   │   │   │       └── bannerList3.vue
│   │   │   ├── PostView.vue              # 【新增】博客详情页
│   │   │   └── 404View.vue
│   │   │
│   │   └── admin/                 # 【管理后台】（需登录）
│   │       ├── AdminLayout.vue           # 后台布局（侧边栏 + 内容区）
│   │       ├── LoginView.vue             # 登录页
│   │       ├── DashboardView.vue         # 仪表盘首页
│   │       ├── PageEditorView.vue        # 页面编辑器（核心）
│   │       ├── BackgroundEditor.vue      # 【子面板】动态背景编辑
│   │       ├── CursorEditor.vue          # 【子面板】鼠标指针编辑
│   │       ├── MusicEditor.vue           # 【子面板】音乐播放器编辑
│   │       ├── BannerEditor.vue          # 【子面板】Banner / 导航编辑
│   │       ├── ContentEditor.vue         # 【子面板】首页内容编辑
│   │       ├── PostsManager.vue          # 博客文章管理（列表 + 编辑）
│   │       ├── PostEditView.vue          # 单篇文章编辑器
│   │       ├── AssetsManager.vue         # 资源管理器（图片/视频/音频）
│   │       ├── SettingsView.vue          # 全局设置（标题/SEO/Favicon）
│   │       └── components/
│   │           ├── AssetUploader.vue     # 资源上传组件（拖拽上传）
│   │           ├── AssetCard.vue         # 资源卡片组件
│   │           ├── ConfigForm.vue        # 动态配置表单组件
│   │           └── LivePreview.vue       # 实时预览 iframe 组件
│   │
│   ├── components/                # 【共享组件】
│   │   ├── bannerView/
│   │   │   └── index.vue                 # 全屏 Banner（支持动态背景配置）
│   │   ├── footerView/
│   │   │   └── index.vue                 # 页脚（网站运行时间等）
│   │   ├── dialogView/
│   │   │   └── index.vue                 # 通用弹窗
│   │   ├── musicView/
│   │   │   └── index.vue                 # 音乐播放器（支持动态音源配置）
│   │   ├── cursorEffect/                 # 【新增】自定义鼠标特效组件
│   │   │   └── index.vue
│   │   └── particleBg/                   # 【新增】粒子/动态背景组件
│   │       └── index.vue
│   │
│   ├── assets/                    # 静态资源
│   │   ├── bg1~22.jpg/png         # 背景图库
│   │   ├── logo.png
│   │   ├── 404.png
│   │   ├── cover.jpg
│   │   └── icons/                  # 图标资源
│   │
│   └── styles/                    # 全局样式
│       ├── variables.scss          # SCSS 变量
│       ├── mixins.scss             # SCSS Mixin
│       ├── global.scss             # 全局样式
│       └── admin.scss              # 编辑器专用样式
│
├── vue.config.js                  # Vue CLI 配置（含多入口 /admin 配置）
├── babel.config.js
├── postcss.config.js
├── package.json
├── .env.development               # 开发环境变量（Supabase URL/Key）
├── .env.production                # 生产环境变量
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions 自动部署脚本
├── Architecture.md                # 本文档
└── README.md
```

---

## 4. 数据库设计

### 4.1 表结构总览

```
Supabase PostgreSQL
│
├── page_config     → 页面动态配置（背景、光标、音乐、Banner、内容等）
├── posts           → 博客文章（Markdown 内容）
├── assets          → 资源元数据（关联 Storage 中的文件）
├── profiles        → 用户个人信息（扩展现有模板中的作者信息）
└── site_settings   → 全局站点设置（标题、SEO、友链等）
```

### 4.2 page_config — 页面动态配置表

所有页面可编辑元素的统一配置存储。使用 JSONB 灵活存储不同类型配置值。

```sql
CREATE TABLE page_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section       TEXT NOT NULL,       -- 页面区块标识
  key           TEXT NOT NULL,       -- 配置键
  value         JSONB NOT NULL,      -- 配置值（JSON 格式，适配不同类型）
  label         TEXT,                -- 人类可读的配置名称
  description   TEXT,                -- 配置说明
  sort_order    INTEGER DEFAULT 0,   -- 排序权重
  is_active     BOOLEAN DEFAULT true,-- 是否启用
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(section, key)               -- 同一区块下配置键唯一
);

-- 索引
CREATE INDEX idx_page_config_section ON page_config(section);
CREATE INDEX idx_page_config_active ON page_config(is_active);

-- RLS 策略
ALTER TABLE page_config ENABLE ROW LEVEL SECURITY;

-- 所有人可读（公开主页需要）
CREATE POLICY "public_read" ON page_config
  FOR SELECT USING (true);

-- 仅认证用户可写（增/改/删）
CREATE POLICY "authenticated_write" ON page_config
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update" ON page_config
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_delete" ON page_config
  FOR DELETE USING (auth.role() = 'authenticated');
```

**section 枚举与对应的 value JSON Schema**：

| section | key | value 结构 | 说明 |
|---------|-----|-----------|------|
| `background` | `type` | `"image"` \| `"video"` \| `"particles"` \| `"gradient"` \| `"live2d"` | 背景类型 |
| `background` | `image_url` | `"https://xxx.supabase.co/storage/v1/object/public/images/bg.jpg"` | 背景图片 URL |
| `background` | `video_url` | `"https://xxx.supabase.co/storage/v1/object/public/videos/bg.mp4"` | 背景视频 URL |
| `background` | `gradient_colors` | `["#ff7e5f", "#feb47b"]` | 渐变色数组 |
| `background` | `particle_config` | `{"count": 80, "color": "#fff", "speed": 2, "shape": "circle"}` | 粒子特效配置 |
| `background` | `overlay_opacity` | `0.4` | 遮罩层透明度 |
| `cursor` | `style` | `"default"` \| `"custom_image"` \| `"trail"` \| `"glow"` | 光标样式 |
| `cursor` | `image_url` | `"https://xxx.supabase.co/storage/v1/object/public/images/cursor.png"` | 自定义光标图片 |
| `cursor` | `trail_config` | `{"length": 10, "color": "#ff6b9d", "size": 8}` | 拖尾特效配置 |
| `cursor` | `glow_config` | `{"radius": 40, "color": "rgba(100,200,255,0.5)"}` | 发光特效配置 |
| `banner` | `images` | `["url1", "url2", "url3"]` | Banner 背景图轮播列表 |
| `banner` | `title` | `"chaichai.top"` | 网站标题 |
| `banner` | `nav_items` | `[{"label":"首页","path":"/about"}, ...]` | 导航菜单项 |
| `banner` | `friend_links` | `[{"name":"百梦","url":"https://marrydream.top/","icon":"..."}]` | 友链列表 |
| `home` | `avatar_url` | `"https://xxx.supabase.co/..."` | 首页头像 URL |
| `home` | `author_name` | `"柴柴"` | 作者名 |
| `home` | `typewriter_texts` | `["嗨 欢迎来到chaichai.top", "励志成为优秀且花里胡哨的程序员"]` | 打字机文本数组 |
| `home` | `social_links` | `[{"platform":"QQ","action":"dialog","value":"2787922490"}, ...]` | 社交链接 |
| `music` | `enabled` | `true` | 是否启用背景音乐 |
| `music` | `playlist` | `[{"name":"...","url":"...","artist":"..."}]` | 播放列表 |
| `music` | `autoplay` | `true` | 是否自动播放 |
| `footer` | `copyright_text` | `"© 2024 YourName 版权所有"` | 版权文字 |
| `footer` | `icp_number` | `"滇ICP备2022000365号"` | ICP 备案号 |
| `footer` | `start_date` | `"2021-08-25"` | 网站运行起始日期 |
| `about` | `banner_image` | `"url"` | 关于页 Banner 背景 |
| `about` | `banner_title` | `"首页"` | 关于页 Banner 标题 |
| `about` | `sidebar_avatar` | `"url"` | 侧边栏头像 |
| `about` | `sidebar_name` | `"柴柴"` | 侧边栏名称 |
| `about` | `sidebar_bio` | `"老爷保佑！前途无量！"` | 侧边栏简介 |
| `global` | `site_title` | `"柴柴の博客 | 技术宅-改变未来"` | 全局页面标题 |
| `global` | `favicon_url` | `"url"` | Favicon URL |
| `global` | `seo_keywords` | `"blog,个人博客,技术"` | SEO 关键词 |

### 4.3 posts — 博客文章表

```sql
CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,           -- 文章标题
  slug          TEXT UNIQUE NOT NULL,     -- URL 友好的唯一标识
  content       TEXT NOT NULL,            -- Markdown 格式正文
  excerpt       TEXT,                     -- 摘要（列表页用）
  cover_url     TEXT,                     -- 封面图 URL
  tags          TEXT[] DEFAULT '{}',      -- 标签数组
  category      TEXT DEFAULT '未分类',     -- 分类
  is_published  BOOLEAN DEFAULT false,    -- 是否发布
  is_top        BOOLEAN DEFAULT false,    -- 是否置顶
  view_count    INTEGER DEFAULT 0,        -- 浏览量
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(is_published);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published" ON posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "authenticated_all" ON posts
  FOR ALL USING (auth.role() = 'authenticated');
```

### 4.4 assets — 资源元数据表

```sql
CREATE TABLE assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,            -- 文件名
  storage_path  TEXT NOT NULL,            -- Supabase Storage 中的路径
  public_url    TEXT NOT NULL,            -- 公开访问 URL
  mime_type     TEXT NOT NULL,            -- MIME 类型 (image/png, video/mp4, audio/mp3)
  category      TEXT NOT NULL,            -- 分类: 'image' | 'video' | 'audio' | 'other'
  size_bytes    BIGINT,                   -- 文件大小（字节）
  width         INTEGER,                  -- 图片/视频宽度
  height        INTEGER,                  -- 图片/视频高度
  tags          TEXT[] DEFAULT '{}',       -- 标签
  description   TEXT,                     -- 描述
  usage_count   INTEGER DEFAULT 0,        -- 被引用次数
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX idx_assets_created ON assets(created_at DESC);

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON assets
  FOR SELECT USING (true);

CREATE POLICY "authenticated_all" ON assets
  FOR ALL USING (auth.role() = 'authenticated');
```

### 4.5 profiles — 用户信息表

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,                     -- 展示名称
  avatar_url    TEXT,                     -- 头像 URL
  bio           TEXT,                     -- 个人简介
  social_links  JSONB DEFAULT '{}',       -- 社交链接
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "user_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 4.6 site_settings — 全局站点设置表

```sql
CREATE TABLE site_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT UNIQUE NOT NULL,     -- 设置键
  value         JSONB NOT NULL,           -- 设置值
  description   TEXT,                     -- 说明
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "authenticated_write" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');
```

**site_settings 预置数据示例**：

| key | value | 说明 |
|-----|-------|------|
| `site_title` | `"我的个人主页"` | 全局默认页面标题 |
| `favicon_url` | `null` | Favicon URL |
| `seo_description` | `"一个二次元风格的个人博客"` | SEO 描述 |
| `seo_keywords` | `["blog","个人博客","二次元"]` | SEO 关键词 |
| `site_start_date` | `"2024-01-01"` | 网站运行起始日 |
| `enable_animation` | `true` | 是否启用入场动画 |
| `enable_music` | `true` | 是否全局启用音乐 |

### 4.7 Supabase Storage Bucket 设计

```
Bucket: public-assets
│
├── images/
│   ├── backgrounds/         # 背景图片
│   ├── avatars/             # 头像
│   ├── cursors/             # 自定义光标图片
│   ├── covers/              # 文章封面
│   └── ui/                  # UI 元素图片
│
├── videos/
│   └── backgrounds/         # 视频背景
│
├── audio/
│   └── music/               # 背景音乐/播放列表
│
└── custom/
    ├── fonts/               # 自定义字体
    └── scripts/             # 自定义脚本
```

**Storage 访问策略**：

```sql
-- 所有人可读（公开访问）
CREATE POLICY "public_read_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');

-- 仅认证用户可上传
CREATE POLICY "authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'public-assets' AND auth.role() = 'authenticated');

-- 仅认证用户可删除自己的文件
CREATE POLICY "authenticated_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
```

---

## 5. 接口与数据链路

### 5.1 数据访问层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Vue 组件层                              │
│  HomeView.vue  FirstView.vue  BlogView.vue  Admin/*.vue     │
└─────────────────────┬───────────────────────────────────────┘
                      │ 调用 service 方法
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services 层 (数据访问封装)                  │
│                                                             │
│  pageConfigService.js    → page_config 表 CRUD               │
│  postsService.js         → posts 表 CRUD                     │
│  assetsService.js        → assets 表 + Storage 上传/删除      │
│  authService.js          → Supabase Auth (signIn/signOut)    │
│  siteSettingsService.js  → site_settings 表                  │
│                                                             │
│  职责：                                                      │
│  · 封装 Supabase SDK 调用                                     │
│  · 数据格式转换（snake_case ↔ camelCase）                     │
│  · 错误处理 + 重试逻辑                                        │
│  · 缓存失效通知                                               │
└─────────────────────┬───────────────────────────────────────┘
                      │ @supabase/supabase-js
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase JS Client                         │
│                                                             │
│  const supabase = createClient(url, anonKey)                 │
│                                                             │
│  · supabase.from('page_config').select('*')                  │
│  · supabase.from('page_config').upsert({...})                │
│  · supabase.storage.from('public-assets').upload(path, file)  │
│  · supabase.auth.signInWithPassword({email, password})       │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 核心 API 接口文档

#### 5.2.1 PageConfig Service

```javascript
// services/pageConfigService.js

/**
 * 获取某区块的所有配置
 * @param {string} section - 区块标识，如 'background', 'cursor', 'home'
 * @returns {Promise<Array<{key: string, value: any}>>}
 */
async function getSectionConfig(section) {
  const { data, error } = await supabase
    .from('page_config')
    .select('key, value, label, description')
    .eq('section', section)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  // 转换为 { key: value } 的 key-value map
  return data.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

/**
 * 获取所有页面配置（编辑器用）
 * @returns {Promise<Array>}
 */
async function getAllConfigs() {
  const { data, error } = await supabase
    .from('page_config')
    .select('*')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * 批量更新配置（编辑器保存时调用）
 * @param {Array<{section: string, key: string, value: any}>} configs
 * @returns {Promise<void>}
 */
async function batchUpsertConfigs(configs) {
  const { error } = await supabase
    .from('page_config')
    .upsert(
      configs.map(c => ({
        section: c.section,
        key: c.key,
        value: c.value,
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'section, key' }
    );

  if (error) throw error;
}

/**
 * 删除某个配置项
 */
async function deleteConfig(section, key) {
  const { error } = await supabase
    .from('page_config')
    .delete()
    .eq('section', section)
    .eq('key', key);

  if (error) throw error;
}

/**
 * 订阅配置变更（实时更新）
 * @param {Function} callback - 变更回调
 * @returns {object} subscription - 用于取消订阅
 */
function subscribeToChanges(callback) {
  return supabase
    .channel('page_config_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'page_config' },
      callback
    )
    .subscribe();
}
```

#### 5.2.2 Posts Service

```javascript
// services/postsService.js

/**
 * 获取已发布的文章列表（公开页用）
 * @param {object} options - { page, pageSize, category, tag }
 */
async function getPublishedPosts(options = {}) {
  const { page = 1, pageSize = 10, category, tag } = options;

  let query = supabase
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('is_top', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (category) query = query.eq('category', category);
  if (tag) query = query.contains('tags', [tag]);

  const { data, error, count } = await query;
  if (error) throw error;
  return { posts: data, count };
}

/**
 * 通过 slug 获取文章详情
 */
async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 获取所有文章（管理后台用，含草稿）
 */
async function getAllPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * 创建/更新文章
 */
async function savePost(post) {
  const record = {
    ...post,
    updated_at: new Date().toISOString()
  };

  if (!record.id) {
    record.created_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('posts')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 删除文章
 */
async function deletePost(id) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * 生成 URL Slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}
```

#### 5.2.3 Assets Service

```javascript
// services/assetsService.js

/**
 * 上传文件到 Supabase Storage 并在 assets 表创建记录
 * @param {File} file - 浏览器 File 对象
 * @param {string} category - 'image' | 'video' | 'audio' | 'other'
 * @param {string[]} tags - 标签
 * @returns {Promise<object>} 创建的 asset 记录
 */
async function uploadAsset(file, category, tags = []) {
  // 1. 生成存储路径
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${category}s/${timestamp}_${safeName}`;

  // 2. 上传文件到 Storage
  const { error: uploadError } = await supabase
    .storage
    .from('public-assets')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // 3. 获取公开 URL
  const { data: urlData } = supabase
    .storage
    .from('public-assets')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // 4. 在 assets 表创建元数据记录
  const { data, error: dbError } = await supabase
    .from('assets')
    .insert({
      name: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      category,
      size_bytes: file.size,
      tags
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
}

/**
 * 获取资源列表（分页+筛选）
 */
async function getAssets(options = {}) {
  const { page = 1, pageSize = 20, category, search, sortBy = 'created_at', sortDir = 'desc' } = options;

  let query = supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { assets: data, total: count };
}

/**
 * 删除资源（数据库记录 + Storage 文件）
 */
async function deleteAsset(id) {
  // 1. 先获取记录拿到 storage_path
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // 2. 删除 Storage 文件
  const { error: storageError } = await supabase
    .storage
    .from('public-assets')
    .remove([asset.storage_path]);

  if (storageError) throw storageError;

  // 3. 删除数据库记录
  const { error: dbError } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
}

/**
 * 批量删除资源
 */
async function batchDeleteAssets(ids) {
  // 先获取所有 storage_path
  const { data: assets } = await supabase
    .from('assets')
    .select('storage_path')
    .in('id', ids);

  const paths = assets.map(a => a.storage_path);

  // 并行删除
  await Promise.all([
    supabase.storage.from('public-assets').remove(paths),
    supabase.from('assets').delete().in('id', ids)
  ]);
}
```

#### 5.2.4 Auth Service

```javascript
// services/authService.js

/**
 * 初始化 Supabase Auth 状态监听
 * 应在 main.js 中调用，确保应用启动时恢复 session
 */
function initAuth() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('用户已登录:', session.user.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('用户已登出');
      // 如果在管理页面，重定向到登录页
      if (window.location.pathname.startsWith('/admin') &&
          !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
  });
}

/**
 * 邮箱密码登录
 * @returns {Promise<{user, session}>}
 */
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * 登出
 */
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 获取当前 session
 */
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * 获取当前用户
 */
async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * 检查是否已登录（同步，基于本地 session）
 */
function isAuthenticated() {
  return !!supabase.auth.getSession();
}
```

### 5.3 数据流向图

#### 5.3.1 公开主页渲染流程

```
用户访问 /
    │
    ▼
Vue Router → HomeView.vue mounted()
    │
    ├── pageConfigService.getSectionConfig('home')
    │       │
    │       ▼
    │   supabase.from('page_config').select('*').eq('section','home')
    │       │
    │       ▼
    │   返回: { avatar_url, author_name, typewriter_texts, social_links }
    │       │
    │       ▼
    │   HomeView 响应式数据更新 → 模板重新渲染
    │
    ├── pageConfigService.getSectionConfig('background')
    │       │
    │       ▼
    │   返回: { type: 'particles', particle_config: {...} }
    │       │
    │       ▼
    │   <particleBg> 组件接收配置 → 渲染粒子特效
    │
    └── pageConfigService.getSectionConfig('music')
            │
            ▼
        返回: { enabled: true, playlist: [...], autoplay: true }
            │
            ▼
        <musicView> 组件绑定播放列表
```

#### 5.3.2 编辑器保存流程

```
管理员在 /admin/editor/bg 页面修改背景设置
    │
    ▼
用户操作: 选择背景类型 → "视频背景" → 上传视频文件
    │
    ▼
assetsService.uploadAsset(videoFile, 'video', ['background'])
    │
    ├── supabase.storage.from('public-assets').upload(...)     → Storage 存储文件
    └── supabase.from('assets').insert(...)                     → 记录元数据
    │
    ▼
返回: { public_url: 'https://xxx.supabase.co/storage/v1/...' }
    │
    ▼
用户点击"保存配置"
    │
    ▼
pageConfigService.batchUpsertConfigs([
  { section: 'background', key: 'type', value: 'video' },
  { section: 'background', key: 'video_url', value: publicUrl }
])
    │
    ▼
supabase.from('page_config').upsert([...], { onConflict: 'section, key' })
    │
    ├── Supabase Realtime 广播变更事件
    │       │
    │       ▼
    │   所有已连接的客户端收到 page_config_changes 通知
    │   （如果有其他浏览器 Tab 打开主页，可实时更新）
    │
    └── 编辑器显示保存成功 Toast
```

#### 5.3.3 鉴权数据流

```
用户访问 /admin
    │
    ▼
Vue Router beforeEach 守卫
    │
    ├── authService.getSession() → 无 session
    │       │
    │       ▼
    │   router redirect → /admin/login
    │       │
    │       ▼
    │   LoginView.vue: 用户输入邮箱 + 密码
    │       │
    │       ▼
    │   authService.signIn(email, password)
    │       │
    │       ▼
    │   supabase.auth.signInWithPassword({email, password})
    │       │
    │       ├── 成功 → Supabase 存储 JWT 到 localStorage
    │       │        → router redirect → /admin/dashboard
    │       │
    │       └── 失败 → 显示错误提示 "邮箱或密码错误"
    │
    └── authService.getSession() → 有 session
            │
            ▼
        router next() → 正常进入管理页面
```

---

## 6. 鉴权体系

### 6.1 整体方案

使用 Supabase Auth 内置的邮箱/密码认证：

```
┌─────────────────────────────────────────────┐
│              Supabase Auth                   │
│                                              │
│  · 管理用户注册（手动在 Supabase Dashboard   │
│    创建唯一管理员账号）                        │
│  · 签发 JWT (access_token + refresh_token)   │
│  · access_token 有效期 1 小时                 │
│  · refresh_token 自动续期                     │
│  · RLS 策略基于 auth.role() 判断权限          │
└─────────────────────────────────────────────┘
```

### 6.2 用户管理策略

- **不开放注册**：在 Supabase Dashboard 中关闭公开注册（`Enable sign-ups = false`）
- **管理员创建**：通过 Supabase Dashboard → Authentication → Add User 手动创建唯一管理员
- **密码修改**：管理员通过 Supabase Dashboard 或编辑器内"修改密码"功能操作

### 6.3 路由守卫实现

```javascript
// router/index.js 中

// 管理后台路由元标记
const adminRoutes = [
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: 'dashboard' },
      { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'editor', component: () => import('@/views/admin/PageEditorView.vue') },
      { path: 'editor/bg', component: () => import('@/views/admin/BackgroundEditor.vue') },
      { path: 'editor/cursor', component: () => import('@/views/admin/CursorEditor.vue') },
      { path: 'editor/music', component: () => import('@/views/admin/MusicEditor.vue') },
      { path: 'editor/banner', component: () => import('@/views/admin/BannerEditor.vue') },
      { path: 'editor/content', component: () => import('@/views/admin/ContentEditor.vue') },
      { path: 'posts', component: () => import('@/views/admin/PostsManager.vue') },
      { path: 'posts/:id/edit', component: () => import('@/views/admin/PostEditView.vue') },
      { path: 'assets', component: () => import('@/views/admin/AssetsManager.vue') },
      { path: 'settings', component: () => import('@/views/admin/SettingsView.vue') },
    ]
  },
  { path: '/admin/login', component: () => import('@/views/admin/LoginView.vue') },
];

// 全局导航守卫
router.beforeEach(async (to, from, next) => {
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // 检查是否需要鉴权
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // 未登录 → 重定向到登录页，携带目标路径
      next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});
```

### 6.4 登录页面交互

```
┌───────────────────────────────────────────┐
│            🔒 管理员登录                    │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  邮箱                               │  │
│  │  ┌─────────────────────────────┐    │  │
│  │  │ admin@example.com            │    │  │
│  │  └─────────────────────────────┘    │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  密码                               │  │
│  │  ┌─────────────────────────────┐    │  │
│  │  │ ●●●●●●●●                    │    │  │
│  │  └─────────────────────────────┘    │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │           🔑 登 录                  │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  登录状态: ● 未登录                        │
└───────────────────────────────────────────┘

点击登录:
  → 按钮 loading 状态
  → supabase.auth.signInWithPassword()
  → 成功: 跳转到 redirect 参数指定的页面（默认 /admin/dashboard）
  → 失败: 显示 Element UI Message "邮箱或密码错误"
```

---

## 7. 路由设计

### 7.1 完整路由表

| 路径 | 组件 | 鉴权 | 说明 |
|------|------|------|------|
| `/` | `HomeView` | 否 | 首页（头像+打字机+导航） |
| `/about` | `FirstView` | 否 | 关于页（Banner+Markdown+侧边栏） |
| `/blog` | `BlogView` | 否 | 博客列表 |
| `/blog/:slug` | `PostView` | 否 | **新增** 博客详情页 |
| `/404` | `404View` | 否 | 404 页面 |
| `/admin` | `AdminLayout` | 是 | 管理后台入口 → 重定向到 dashboard |
| `/admin/login` | `LoginView` | 否 | 登录页 |
| `/admin/dashboard` | `DashboardView` | 是 | 仪表盘 |
| `/admin/editor` | `PageEditorView` | 是 | 页面编辑器总览 |
| `/admin/editor/bg` | `BackgroundEditor` | 是 | 背景编辑器 |
| `/admin/editor/cursor` | `CursorEditor` | 是 | 光标编辑器 |
| `/admin/editor/music` | `MusicEditor` | 是 | 音乐编辑器 |
| `/admin/editor/banner` | `BannerEditor` | 是 | Banner 编辑器 |
| `/admin/editor/content` | `ContentEditor` | 是 | 首页内容编辑器 |
| `/admin/posts` | `PostsManager` | 是 | 博客文章管理列表 |
| `/admin/posts/new` | `PostEditView` | 是 | 新建文章 |
| `/admin/posts/:id/edit` | `PostEditView` | 是 | 编辑文章 |
| `/admin/assets` | `AssetsManager` | 是 | 资源管理器 |
| `/admin/settings` | `SettingsView` | 是 | 全局设置 |
| `*` | redirect → `/404` | 否 | 未匹配路由 |

### 7.2 路由配置代码结构

```javascript
// router/index.js

import Vue from 'vue'
import VueRouter from 'vue-router'
import { createClient } from '@supabase/supabase-js'

Vue.use(VueRouter)

// 公开页面路由（与模板保持一致）
const publicRoutes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/public/HomeView/HomeView.vue'),
    meta: { title: '' } // 动态从 page_config 获取
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/public/FirstView/FirstView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/views/public/BlogView/BlogView.vue'),
    meta: { title: '博客' }
  },
  {
    path: '/blog/:slug',
    name: 'post',
    component: () => import('@/views/public/PostView.vue'),
    meta: { title: '' }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/public/404View.vue'),
    meta: { title: '404' }
  },
];

// 管理后台路由
const adminRoutes = {
  path: '/admin',
  component: () => import('@/views/admin/AdminLayout.vue'),
  meta: { requiresAuth: true },
  children: [
    { path: '', redirect: 'dashboard' },
    { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '仪表盘' } },
    { path: 'editor', name: 'PageEditor', component: () => import('@/views/admin/PageEditorView.vue'), meta: { title: '页面编辑器' } },
    { path: 'editor/bg', name: 'BgEditor', component: () => import('@/views/admin/BackgroundEditor.vue'), meta: { title: '背景编辑' } },
    { path: 'editor/cursor', name: 'CursorEditor', component: () => import('@/views/admin/CursorEditor.vue'), meta: { title: '光标编辑' } },
    { path: 'editor/music', name: 'MusicEditor', component: () => import('@/views/admin/MusicEditor.vue'), meta: { title: '音乐编辑' } },
    { path: 'editor/banner', name: 'BannerEditor', component: () => import('@/views/admin/BannerEditor.vue'), meta: { title: 'Banner编辑' } },
    { path: 'editor/content', name: 'ContentEditor', component: () => import('@/views/admin/ContentEditor.vue'), meta: { title: '内容编辑' } },
    { path: 'posts', name: 'PostsManager', component: () => import('@/views/admin/PostsManager.vue'), meta: { title: '文章管理' } },
    { path: 'posts/new', name: 'NewPost', component: () => import('@/views/admin/PostEditView.vue'), meta: { title: '新建文章' } },
    { path: 'posts/:id/edit', name: 'EditPost', component: () => import('@/views/admin/PostEditView.vue'), meta: { title: '编辑文章' } },
    { path: 'assets', name: 'AssetsManager', component: () => import('@/views/admin/AssetsManager.vue'), meta: { title: '资源管理' } },
    { path: 'settings', name: 'Settings', component: () => import('@/views/admin/SettingsView.vue'), meta: { title: '全局设置' } },
  ]
};

const loginRoute = {
  path: '/admin/login',
  name: 'Login',
  component: () => import('@/views/admin/LoginView.vue'),
  meta: { title: '管理员登录' }
};

const catchAllRoute = {
  path: '*',
  redirect: '/404',
  hidden: true
};

const router = new VueRouter({
  mode: 'history', // 使用 history 模式（需 GitHub Pages 404 fallback 支持）
  routes: [...publicRoutes, adminRoutes, loginRoute, catchAllRoute]
});

// 全局守卫（见 6.3 节）
// ...

export default router;
```

---

## 8. 组件树与页面结构

### 8.1 公开页面组件树

```
App.vue
│
├── <router-view> (带 Animate.css 过渡动画)
│   │
│   ├── [/] HomeView.vue
│   │   ├── <el-avatar>                    头像（URL 从 page_config 获取）
│   │   ├── <typewriter>                    打字机文本（文本数组从 page_config 获取）
│   │   ├── <el-button> x3                  导航按钮（首页/博客/后台）
│   │   ├── <img> social icons              社交链接图标（QQ/GitHub）
│   │   ├── <dialogView>                    弹窗组件
│   │   └── 版权信息
│   │
│   ├── [/about] FirstView.vue
│   │   ├── <bannerView>                    全屏 Banner
│   │   │   ├── 背景图片（从 page_config 获取）
│   │   │   ├── <el-menu>                   导航菜单
│   │   │   │   ├── 首页
│   │   │   │   ├── 博客
│   │   │   │   └── 友链（子菜单）
│   │   │   └── 标题文字
│   │   ├── <markdown>                      Markdown 内容区
│   │   ├── 侧边栏
│   │   │   ├── <el-avatar>                 头像
│   │   │   ├── 名称
│   │   │   ├── 简介
│   │   │   └── 狐狸 GIF
│   │   ├── 返回顶部按钮
│   │   └── <footerView>                   页脚
│   │
│   ├── [/blog] BlogView.vue
│   │   ├── <bannerView>                    Banner
│   │   ├── <bannerList1>                   博客列表区块1（从 posts 表加载）
│   │   ├── <bannerList2>                   博客列表区块2
│   │   ├── <bannerList3>                   博客列表区块3
│   │   └── <footerView>
│   │
│   └── [/blog/:slug] PostView.vue          【新增】
│       ├── <bannerView>
│       ├── <markdown>                      文章内容
│       │   └── 内容从 posts.content 渲染
│       └── <footerView>
│
├── <particleBg>                            【新增】全局粒子/动态背景
├── <cursorEffect>                          【新增】全局自定义光标特效
├── <musicView>                             全局音乐播放器（启用/播放列表从 page_config 获取）
└── <audio>                                 背景音乐元素
```

### 8.2 管理后台组件树

```
App.vue → <router-view>
│
└── [/admin/*] AdminLayout.vue
    ├── 左侧菜单 (el-menu, mode="vertical")
    │   ├── 📊 仪表盘        → /admin/dashboard
    │   ├── 🎨 页面编辑器     → /admin/editor (子菜单展开)
    │   │   ├── 🌄 动态背景   → /admin/editor/bg
    │   │   ├── 🖱️ 鼠标指针   → /admin/editor/cursor
    │   │   ├── 🎵 背景音乐   → /admin/editor/music
    │   │   ├── 🏠 Banner    → /admin/editor/banner
    │   │   └── 📝 首页内容   → /admin/editor/content
    │   ├── 📄 文章管理      → /admin/posts
    │   ├── 🖼️ 资源管理      → /admin/assets
    │   └── ⚙️ 全局设置      → /admin/settings
    │
    ├── 顶部栏
    │   ├── 面包屑导航
    │   └── 用户信息 + 退出按钮
    │
    └── <router-view> (子路由内容区)
        │
        ├── DashboardView.vue
        │   └── 统计卡片（文章数/资源数/上次更新时间）+ 快捷入口
        │
        ├── BackgroundEditor.vue
        │   ├── 背景类型选择器 (el-radio-group)
        │   ├── 图片上传/选择（集成 AssetUploader）
        │   ├── 视频上传/选择
        │   ├── 粒子参数配置 (el-slider + el-color-picker)
        │   ├── 渐变配置 (渐变色条 + 方向选择)
        │   ├── LivePreview（实时预览 iframe）
        │   └── 保存按钮
        │
        ├── CursorEditor.vue
        │   ├── 光标样式选择器
        │   ├── 自定义光标图片上传
        │   ├── 拖尾特效参数 (长度/颜色/大小)
        │   ├── 发光特效参数 (半径/颜色/透明度)
        │   └── LivePreview
        │
        ├── MusicEditor.vue
        │   ├── 启用/禁用开关
        │   ├── 播放列表管理器（添加/删除/排序）
        │   ├── 音频文件上传
        │   └── 自动播放开关
        │
        ├── BannerEditor.vue
        │   ├── Banner 背景图管理（多图轮播列表）
        │   ├── 网站标题编辑
        │   ├── 导航菜单项编辑器（增删改排序）
        │   └── 友链管理器（名称/URL/图标）
        │
        ├── ContentEditor.vue
        │   ├── 头像 URL 编辑 + 上传
        │   ├── 作者名编辑
        │   ├── 打字机文本编辑器（多行文本数组管理）
        │   └── 社交链接编辑器（平台/动作/值）
        │
        ├── PostsManager.vue
        │   ├── 文章列表表格 (el-table)
        │   │   ├── 标题 / 分类 / 标签 / 状态 / 创建时间
        │   │   └── 操作按钮（编辑/删除/发布/取消发布）
        │   ├── 筛选栏（分类/标签/状态/搜索）
        │   └── 新建文章按钮
        │
        ├── PostEditView.vue
        │   ├── 标题输入框
        │   ├── Slug 编辑（自动生成 + 手动修改）
        │   ├── 封面图上传
        │   ├── 分类/标签选择器
        │   ├── <el-tiptap> 富文本编辑器（Markdown 格式）
        │   ├── 摘要编辑
        │   ├── 发布/存草稿/预览按钮
        │   └── 返回列表链接
        │
        ├── AssetsManager.vue
        │   ├── 上传区域（拖拽上传 + 点击上传）
        │   ├── 分类筛选 Tab（全部/图片/视频/音频/其他）
        │   ├── 搜索框
        │   ├── 资源网格展示（el-card 列表）
        │   │   └── AssetCard.vue (缩略图 + 名称 + 大小 + 复制 URL + 删除)
        │   └── 批量选择 + 批量删除
        │
        └── SettingsView.vue
            ├── 站点标题
            ├── Favicon 上传
            ├── SEO 描述/关键词
            ├── 网站运行起始日
            ├── ICP 备案号
            └── 版权信息
```

---

## 9. 数据流与交互逻辑

### 9.1 主页加载时序

```
1. 用户访问 https://your-domain.com/
2. index.html 加载
3. Vue 实例初始化
4. App.vue mounted()
   │
   ├── 初始化 Supabase 客户端 (config/supabase.js)
   ├── 检查 session（静默，不影响公开页）
   │
   └── 渲染 <router-view>
       │
       └── HomeView.vue created()
           ├── pageConfigService.getSectionConfig('home')
           ├── pageConfigService.getSectionConfig('background')
           └── pageConfigService.getSectionConfig('music')
               │
               ├── 三个请求并行发出
               │
               ▼
           Promise.all([...])
               │
               ▼
           数据绑定到组件 data
               │
               ▼
           模板渲染:
           · 头像 → data.homeConfig.avatar_url
           · 打字机文本 → data.homeConfig.typewriter_texts
           · 社交链接 → data.homeConfig.social_links
           · 背景 → <particleBg :config="data.bgConfig.particle_config" />
           · 音乐 → <musicView :playlist="data.musicConfig.playlist" />
```

### 9.2 编辑器实时预览流程

```
BackgroundEditor.vue
│
├── 用户调整粒子数量 slider: 80 → 150
│   │
│   ▼
├── data.particleConfig.count = 150 (本地响应式更新)
│   │
│   ▼
├── LivePreview.vue (内嵌 iframe)
│   │
│   │   iframe 指向 /preview?type=background&config=<encoded_json>
│   │   或通过 postMessage 传递配置:
│   │   iframe.contentWindow.postMessage({
│   │     type: 'background_update',
│   │     config: { type: 'particles', particle_config: {...} }
│   │   }, '*')
│   │
│   │   iframe 内的页面监听 message 事件 → 更新粒子渲染
│   │
│   ▼
│   用户看到实时预览效果
│
├── 用户点击"保存配置"
│   │
│   ▼
├── pageConfigService.batchUpsertConfigs([...])
│   │
│   ▼
├── 保存成功 → el-message "配置已保存"
│   │
│   ▼
└── Supabase Realtime 广播 → 如果有其他 Tab 打开主页，触发刷新
```

### 9.3 资源上传与管理流程

```
AssetsManager.vue
│
├── 用户拖拽图片到上传区域
│   │
│   ▼
├── AssetUploader.vue 检测 File 对象
│   │
│   ├── 前端校验: 类型 (image/png, image/jpeg, image/gif, image/webp)
│   │            大小 (< 50MB)
│   │            数量 (单次最多 20 个)
│   │
│   ▼
├── 显示上传进度列表（每个文件独立进度条）
│   │
│   ├── assetsService.uploadAsset(file, 'image', ['background'])
│   │   │
│   │   ├── supabase.storage.from('public-assets').upload(...)
│   │   │   └── 返回上传进度事件
│   │   │
│   │   └── supabase.from('assets').insert(...)
│   │
│   ▼
├── 全部上传完成 → 刷新资源列表
│   │
│   ▼
├── 用户点击某个资源的"复制 URL"按钮
│   │
│   ▼
├── navigator.clipboard.writeText(asset.public_url)
│   └── el-message "URL 已复制到剪贴板"
│
├── 用户勾选多个资源 → 点击"批量删除"
│   │
│   ▼
├── el-message-box 确认对话框 "确定删除 5 个资源吗？"
│   │
│   ▼
├── assetsService.batchDeleteAssets(ids)
│   ├── supabase.storage 删除文件
│   └── supabase.from('assets') 删除记录
│   │
│   ▼
└── 刷新列表
```

### 9.4 博客文章发布流程

```
PostEditView.vue
│
├── 用户编辑文章
│   ├── 输入标题 → 自动生成 slug
│   ├── 上传封面图 → 插入到 assets 表
│   ├── 选择分类/标签
│   ├── <el-tiptap> 编辑 Markdown 正文
│   └── 填写摘要（可选，不填则自动截取正文前200字）
│
├── 用户点击"发布"
│   │
│   ▼
├── postsService.savePost({
│     title, slug, content, excerpt, cover_url,
│     tags, category, is_published: true
│   })
│   │
│   ▼
├── supabase.from('posts').upsert({...})
│   │
│   ▼
├── 保存成功 → el-message "文章已发布"
│   │
│   ▼
└── router.push('/admin/posts') → 返回文章列表
```

### 9.5 全局状态缓存策略

```
stores/pageConfig.js

┌─────────────────────────────────────────┐
│  单例响应式缓存                           │
│                                          │
│  data: {                                 │
│    cache: {                              │
│      background: { ... },               │
│      cursor:      { ... },               │
│      home:        { ... },               │
│      banner:      { ... },               │
│      music:       { ... },               │
│      about:       { ... },               │
│      global:      { ... },               │
│    },                                    │
│    loading: false,                       │
│    lastFetch: null,                      │
│  }                                       │
│                                          │
│  方法:                                    │
│  · loadAll()          → 加载全部配置      │
│  · getSection(s)      → 获取某区块配置    │
│  · invalidate()       → 清除缓存          │
│  · subscribeRealtime()→ 订阅实时变更      │
└─────────────────────────────────────────┘

使用方式:
  组件中 import pageConfigStore from '@/stores/pageConfig'
  公开页面在 App.vue created() 中调用 pageConfigStore.loadAll()
  后续组件直接从 store 读取，无需重复请求
  编辑器保存后调用 pageConfigStore.invalidate() 清除缓存
```

---

## 10. 功能清单

### 10.1 公开主页功能

| 编号 | 功能 | 状态 | 说明 |
|------|------|------|------|
| P-01 | 首页 (HomeView) | 继承模板 | 头像、打字机文本、导航按钮、社交链接 |
| P-02 | 关于页 (FirstView) | 继承模板 | 全屏 Banner、Markdown 内容区、侧边栏、页脚 |
| P-03 | 博客列表页 (BlogView) | 继承模板 | Banner、博客卡片列表 |
| P-04 | 博客详情页 | **新增** | 根据 slug 加载文章，Markdown 渲染 |
| P-05 | 404 页面 | 继承模板 | 自定义 404 图片 + 返回首页 |
| P-06 | 动态背景渲染 | **新增** | 支持图片/视频/粒子/渐变/Live2D 五种背景模式 |
| P-07 | 自定义光标特效 | **新增** | 支持自定义图片光标/拖尾/发光特效 |
| P-08 | 动态音乐播放器 | 增强模板 | 播放列表从云端加载，支持开关 |
| P-09 | 响应式适配 | 继承模板 | PC 端适配（amfe-flexible） |
| P-10 | 入场动画 | 继承模板 | Animate.css 页面过渡 |
| P-11 | 页面数据云端加载 | **新增** | 所有可编辑内容从 Supabase 动态获取 |
| P-12 | SEO 元标签 | **新增** | 动态 title/description/keywords |

### 10.2 管理后台功能

| 编号 | 功能 | 说明 |
|------|------|------|
| A-01 | 登录/登出 | 邮箱+密码登录，session 管理 |
| A-02 | 仪表盘 | 统计概览 + 快捷入口 |
| A-03 | 动态背景编辑器 | 选择背景类型 → 配置参数 → 实时预览 → 保存 |
| A-04 | 鼠标指针编辑器 | 选择光标样式 → 配置特效参数 → 实时预览 |
| A-05 | 背景音乐编辑器 | 播放列表管理 + 音频上传 + 启用开关 |
| A-06 | Banner 编辑器 | 背景图管理 + 导航菜单 + 友链管理 |
| A-07 | 首页内容编辑器 | 头像/作者名/打字机文本/社交链接编辑 |
| A-08 | 文章管理 | 列表 + 新建 + 编辑 + 删除 + 发布/取消发布 |
| A-09 | 富文本编辑器 | Element Tiptap 全功能 Markdown 编辑 |
| A-10 | 资源管理器 | 图片/视频/音频上传、浏览、搜索、删除 |
| A-11 | 拖拽上传 | 支持批量拖拽文件到上传区域 |
| A-12 | 资源搜索 | 按名称/标签/分类搜索 |
| A-13 | 复制资源 URL | 一键复制公开 URL |
| A-14 | 全局设置 | 站点标题/Favicon/SEO/版权/备案号 |
| A-15 | 实时预览 | 编辑器内嵌 iframe 预览修改效果 |

### 10.3 部署与运维功能

| 编号 | 功能 | 说明 |
|------|------|------|
| D-01 | GitHub Pages 部署 | GitHub Actions 自动构建 + 部署 |
| D-02 | 自定义域名 | CNAME + Cloudflare DNS |
| D-03 | HTTPS 支持 | GitHub Pages 自动提供 Let's Encrypt 证书 |
| D-04 | 404 Fallback | SPA history 模式兼容处理 |
| D-05 | 环境变量管理 | .env 分离开发/生产 Supabase 配置 |

---

## 11. 图形化编辑器设计

### 11.1 编辑器整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  Top Bar                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🏠 返回主页  |  📊 仪表盘 / 🎨 页面编辑器 / 背景编辑     │ │
│  │                                        👤 admin@xxx  退出 │ │
│  └─────────────────────────────────────────────────────────┘ │
├────────────┬─────────────────────────────────────────────────┤
│  Sidebar   │           Editor Content Area                   │
│            │                                                 │
│  📊 仪表盘  │  ┌───────────────────────────────────────────┐ │
│  🎨 编辑器  │  │  Background Type: ○ 图片 ○ 视频           │ │
│  ├─🌄 背景  │  │                    ○ 粒子 ◎ 渐变          │ │
│  ├─🖱️ 光标  │  │                                           │ │
│  ├─🎵 音乐  │  │  [Upload Image] [Select from Assets]      │ │
│  ├─🏠 Banner│  │                                           │ │
│  └─📝 内容  │  │  Preview:                                 │ │
│  📄 文章    │  │  ┌─────────────────────────────────────┐  │ │
│  🖼️ 资源    │  │  │                                     │  │ │
│  ⚙️ 设置    │  │  │     Real-time Preview Area          │  │ │
│            │  │  │     (iframe or Canvas)               │  │ │
│            │  │  │                                     │  │ │
│            │  │  └─────────────────────────────────────┘  │ │
│            │  │                                           │ │
│            │  │  [💾 Save Configuration]                  │ │
│            │  └───────────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────────┘
```

### 11.2 编辑器核心交互模式

每个编辑器子页面遵循统一的交互模式：

```
┌─────────────────────────────────────┐
│        编辑器通用交互流程             │
│                                     │
│  1. 进入页面 → 加载当前配置           │
│       │                             │
│       ▼                             │
│  2. 表单呈现当前值（可编辑状态）       │
│       │                             │
│       ▼                             │
│  3. 用户修改（本地实时响应）           │
│       │                             │
│       ├── 简单参数（文本/颜色/开关）    │
│       │   └── 直接 v-model 绑定      │
│       │                             │
│       ├── 媒体资源（图片/视频/音频）    │
│       │   ├── 从资源管理器选择         │
│       │   │   └── 弹出 AssetPicker   │
│       │   └── 直接上传               │
│       │       └── AssetUploader      │
│       │                             │
│       └── 实时预览                   │
│           └── LivePreview 组件       │
│               └── 防抖更新 (300ms)   │
│       │                             │
│       ▼                             │
│  4. 点击"保存"                       │
│       │                             │
│       ▼                             │
│  5. pageConfigService.batchUpsert    │
│       │                             │
│       ▼                             │
│  6. 成功提示 + 缓存失效               │
│                                     │
└─────────────────────────────────────┘
```

### 11.3 实时预览技术方案

```
LivePreview.vue 实现方式：PostMessage 通信

┌──────────────────────────┐        ┌──────────────────────────┐
│     Editor Page          │        │    Preview iframe         │
│                          │        │                          │
│  data.config → watch     │        │  window.addEventListener  │
│    │                     │        │  ('message', (e) => {    │
│    ▼                     │        │    updatePreview(e.data)  │
│  iframeRef.contentWindow │        │  })                      │
│    .postMessage({        │        │                          │
│      type: 'update',     │  ───►  │  // 更新粒子/光标/背景   │
│      section: 'bg',      │        │  // 实时响应配置变更      │
│      config: {...}       │        │                          │
│    }, '*')               │        │                          │
└──────────────────────────┘        └──────────────────────────┘

优势：
- 无需后端服务，纯前端通信
- 预览区独立渲染，与编辑器互不影响
- 预览效果与真实页面 100% 一致（复用同一组件）
```

### 11.4 AssetPicker 组件设计

```
编辑器中选择图片时，弹出 AssetPicker 对话框：

┌──────────────────────────────────────────────┐
│  选择资源                            [上传] [X]│
│  ┌──────────────────────────────────────────┐│
│  │  [全部] [图片] [视频] [音频]    🔍 搜索... ││
│  ├──────────────────────────────────────────┤│
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐      ││
│  │ │    │ │    │ │    │ │    │ │    │      ││
│  │ │ bg │ │ bg │ │bg  │ │    │ │    │      ││
│  │ │ 1  │ │ 2  │ │ 3  │ │... │ │... │      ││
│  │ │    │ │    │ │    │ │    │ │    │      ││
│  │ └────┘ └────┘ └────┘ └────┘ └────┘      ││
│  │                                          ││
│  │         < 1 2 3 ... 10 >                ││
│  └──────────────────────────────────────────┘│
│                     [取消]  [✓ 确认选择]      │
└──────────────────────────────────────────────┘
```

---

## 12. 部署架构

### 12.1 部署流程图

```
┌─────────────────────────────────────────────────────────┐
│                  开发流程                                 │
│                                                         │
│  本地开发          git push           GitHub Actions     │
│  ┌──────┐         ┌──────┐           ┌──────────────┐   │
│  │ VS   │ ──────► │ main │ ────────► │ 1. checkout  │   │
│  │ Code │         │ 分支  │           │ 2. npm ci    │   │
│  └──────┘         └──────┘           │ 3. npm run   │   │
│      │                               │    build     │   │
│      │ npm run serve                  │ 4. deploy to│   │
│      ▼                               │    gh-pages  │   │
│  localhost:8080                      └──────┬───────┘   │
│                                              │           │
└──────────────────────────────────────────────┼───────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub Pages 部署                            │
│                                                         │
│  gh-pages 分支                                          │
│  ┌──────────────────────────────────────┐               │
│  │  dist/                               │               │
│  │  ├── index.html                      │               │
│  │  ├── CNAME (your-domain.com)         │               │
│  │  ├── 404.html                        │               │
│  │  ├── css/                            │               │
│  │  ├── js/                             │               │
│  │  └── assets/                         │               │
│  └──────────────────────────────────────┘               │
│              │                                          │
│              ▼                                          │
│  https://your-domain.com  ← Cloudflare DNS             │
│  (HTTPS by Let's Encrypt)                               │
└─────────────────────────────────────────────────────────┘
```

### 12.2 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]        # main 分支推送触发构建
  workflow_dispatch:          # 支持手动触发

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build
        env:
          VUE_APP_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VUE_APP_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run build

      - name: Create CNAME
        run: echo 'your-domain.com' > dist/CNAME

      - name: Copy 404.html
        run: cp dist/index.html dist/404.html

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
          force_orphan: true
```

### 12.3 Vue CLI 构建配置

```javascript
// vue.config.js

module.exports = {
  publicPath: '/',           // GitHub Pages 使用根路径（自定义域名）
  outputDir: 'dist',

  // SPA history 模式需要 fallback
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/index.html' },
        { from: /./, to: '/index.html' }
      ]
    }
  },

  chainWebpack: config => {
    // 保留原有 Markdown loader 配置
    config.module.rule('md')
      .test(/\.md/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('vue-markdown-loader')
      .loader('vue-markdown-loader/lib/markdown-compiler')
      .options({
        raw: true
      });
  },

  // 生产环境 source map 关闭以减小体积
  productionSourceMap: false,
};
```

### 12.4 Supabase 项目配置

```
Supabase 项目初始化步骤：

1. 创建 Supabase 项目
   → https://supabase.com → New Project
   → 名称：personal-homepage
   → 数据库密码：（生成强密码）
   → 区域：选择离用户最近的（如 ap-southeast-1 新加坡）

2. 获取 API 密钥
   → Settings → API
   → Project URL: https://xxxxx.supabase.co
   → anon public key: eyJhbGciOiJI...
   → service_role key: eyJhbGciOiJI...（仅用于管理，不暴露给前端）

3. 创建数据库表
   → SQL Editor → 执行 Architecture.md 第4章的建表 SQL

4. 创建 Storage Bucket
   → Storage → New Bucket
   → Name: public-assets
   → Public bucket: ✓ ON
   → 执行 Storage 访问策略 SQL

5. 创建管理员账号
   → Authentication → Users → Add User
   → Email: admin@yourdomain.com
   → Password: （设置强密码）
   → 确认 "Auto Confirm User"

6. 关闭公开注册
   → Authentication → Settings → Email Auth
   → Enable sign-ups: OFF

7. 配置环境变量（用于 GitHub Actions Secrets）
   → GitHub Repo → Settings → Secrets and variables → Actions
   → New repository secrets:
     · SUPABASE_URL = https://xxxxx.supabase.co
     · SUPABASE_ANON_KEY = eyJhbGciOiJI...
```

---

## 13. 自定义域名配置

### 13.1 域名配置流程

```
1. 购买域名
   → 推荐：Cloudflare Registrar / Namecheap / 阿里云万网
   → 示例域名：yourname.com

2. DNS 配置（推荐 Cloudflare 管理 DNS）
   → 添加 CNAME 记录：
     · 类型：CNAME
     · 名称：@（或 www）
     · 目标：<your-github-username>.github.io
     · TTL：自动

   → 如果需要 apex domain（裸域）：
     · 添加 A 记录指向 GitHub Pages IP：
       · 185.199.108.153
       · 185.199.109.153
       · 185.199.110.153
       · 185.199.111.153

3. GitHub Pages 设置
   → Repo → Settings → Pages
   → Source: Deploy from a branch → gh-pages → / (root)
   → Custom domain: yourname.com
   → ✓ Enforce HTTPS

4. 等待 DNS 生效 + HTTPS 证书签发（通常 5-30 分钟）
```

### 13.2 CNAME 文件

```
public/CNAME 内容：
your-domain.com
```

---

## 14. 实施任务拆解

### 阶段一：环境搭建（预计 2-3 小时）

| 任务编号 | 任务 | 优先级 | 预估耗时 |
|---------|------|--------|---------|
| T-01 | 将模板代码迁移到 MainPage/，初始化 Git 仓库 | P0 | 30min |
| T-02 | 创建 Supabase 项目，执行建表 SQL | P0 | 1h |
| T-03 | 配置 .env 环境变量文件 | P0 | 15min |
| T-04 | 安装 @supabase/supabase-js 依赖 | P0 | 10min |
| T-05 | 初始化 Supabase 客户端 (config/supabase.js) | P0 | 15min |
| T-06 | 创建 GitHub 仓库，推送代码 | P0 | 15min |

### 阶段二：数据层建设（预计 3-4 小时）

| 任务编号 | 任务 | 优先级 | 预估耗时 |
|---------|------|--------|---------|
| T-07 | 实现 services/pageConfigService.js | P0 | 1h |
| T-08 | 实现 services/postsService.js | P0 | 45min |
| T-09 | 实现 services/assetsService.js | P0 | 45min |
| T-10 | 实现 services/authService.js | P0 | 30min |
| T-11 | 实现 stores/pageConfig.js 全局缓存 | P1 | 30min |
| T-12 | 实现 stores/auth.js 鉴权状态 | P1 | 30min |

### 阶段三：公开页面改造（预计 4-5 小时）

| 任务编号 | 任务 | 优先级 | 预估耗时 |
|---------|------|--------|---------|
| T-13 | 改造 HomeView.vue：数据从 page_config 加载 | P0 | 1h |
| T-14 | 改造 FirstView.vue：Banner/侧边栏从 page_config 加载 | P0 | 1h |
| T-15 | 改造 BlogView.vue：博客列表从 posts 表加载 | P0 | 1h |
| T-16 | **新增** PostView.vue：博客详情页 | P1 | 1h |
| T-17 | 改造 bannerView：导航菜单/友链从 page_config 加载 | P0 | 45min |
| T-18 | 改造 footerView：版权/运行时间从配置加载 | P1 | 30min |
| T-19 | 改造 musicView：播放列表从 page_config 加载 | P1 | 30min |
| T-20 | **新增** cursorEffect 组件：自定义光标渲染 | P2 | 1.5h |
| T-21 | **新增** particleBg 组件：粒子背景渲染 | P2 | 2h |
| T-22 | 改造 App.vue：集成动态背景/光标/音乐组件 | P1 | 30min |

### 阶段四：管理后台搭建（预计 8-12 小时）

| 任务编号 | 任务 | 优先级 | 预估耗时 |
|---------|------|--------|---------|
| T-23 | 实现 AdminLayout.vue：侧边栏 + 顶部栏布局 | P0 | 1h |
| T-24 | 实现 LoginView.vue：登录表单 + 鉴权逻辑 | P0 | 1h |
| T-25 | 实现路由守卫 authGuard | P0 | 30min |
| T-26 | 实现 DashboardView.vue：统计概览 | P1 | 1h |
| T-27 | 实现 BackgroundEditor.vue：背景类型选择+参数配置+预览 | P0 | 2h |
| T-28 | 实现 CursorEditor.vue：光标样式配置+预览 | P1 | 1.5h |
| T-29 | 实现 MusicEditor.vue：播放列表管理 | P1 | 1h |
| T-30 | 实现 BannerEditor.vue：Banner/导航/友链管理 | P1 | 1.5h |
| T-31 | 实现 ContentEditor.vue：首页内容编辑 | P1 | 1h |
| T-32 | 实现 PostsManager.vue：文章列表+筛选 | P0 | 1.5h |
| T-33 | 实现 PostEditView.vue：文章编辑器（Element Tiptap） | P0 | 2h |
| T-34 | 实现 AssetsManager.vue：资源管理页 | P0 | 2h |
| T-35 | 实现 AssetUploader.vue：拖拽上传组件 | P0 | 1.5h |
| T-36 | 实现 AssetCard.vue：资源卡片组件 | P0 | 30min |
| T-37 | 实现 AssetPicker.vue：资源选择器弹窗 | P1 | 1h |
| T-38 | 实现 LivePreview.vue：实时预览组件 | P1 | 1.5h |
| T-39 | 实现 SettingsView.vue：全局设置页 | P2 | 30min |

### 阶段五：部署与测试（预计 2-3 小时）

| 任务编号 | 任务 | 优先级 | 预估耗时 |
|---------|------|--------|---------|
| T-40 | 编写 GitHub Actions deploy.yml | P0 | 30min |
| T-41 | 配置 GitHub Pages 部署 | P0 | 30min |
| T-42 | 创建 Supabase 管理员账号 + 关闭公开注册 | P0 | 15min |
| T-43 | 配置 GitHub Actions Secrets | P0 | 15min |
| T-44 | 购买域名 + 配置 Cloudflare DNS | P0 | 30min |
| T-45 | 验证 HTTPS + 自定义域名生效 | P0 | 15min |
| T-46 | 编写 README.md 使用说明 | P2 | 30min |
| T-47 | 端到端测试：公开主页访问 → 后台登录 → 编辑 → 保存 → 主页刷新 | P0 | 1h |

### 阶段六：可选增强（预计 3-5 小时）

| 任务编号 | 任务 | 优先级 | 预估耗时 |
|---------|------|--------|---------|
| T-48 | Live2D 看板娘背景集成 | P3 | 2h |
| T-49 | 访问统计（页面浏览量计数器） | P3 | 1h |
| T-50 | 文章评论系统（Giscus / Utterances） | P3 | 1h |
| T-51 | 暗黑模式切换 | P3 | 2h |
| T-52 | PWA 离线支持 | P3 | 1h |

### 优先级定义

| 级别 | 含义 |
|------|------|
| P0 | 必须实现，否则核心功能不可用 |
| P1 | 应该实现，提升体验 |
| P2 | 可以延后，锦上添花 |
| P3 | 未来考虑，高级特性 |

### 里程碑规划

```
Week 1:
  └── 阶段一 + 阶段二: 环境跑通 + 数据层就绪
      里程碑: 能在本地从 Supabase 读写数据

Week 2:
  └── 阶段三: 公开页面改造完成
      里程碑: 主页数据全部从云端加载，视觉效果完整

Week 3-4:
  └── 阶段四: 管理后台完成
      里程碑: 登录 → 编辑 → 保存 → 刷新主页，全链路打通

Week 5:
  └── 阶段五: 部署上线
      里程碑: 自定义域名可公开访问，https://your-domain.com
```

---

## 15. 附录

### 15.1 环境变量模板

```bash
# .env.development
VUE_APP_SUPABASE_URL=https://xxxxx.supabase.co
VUE_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.production
VUE_APP_SUPABASE_URL=https://xxxxx.supabase.co
VUE_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 15.2 Supabase 客户端初始化代码

```javascript
// src/config/supabase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未配置，请检查 .env 文件')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // 持久化 session（localStorage）
    autoRefreshToken: true,      // 自动刷新 token
    detectSessionInUrl: true,    // 检测 URL 中的 session（OAuth 回调）
  },
  realtime: {
    params: {
      eventsPerSecond: 2,        // Realtime 每秒最大事件数
    }
  }
})

export default supabase
```

### 15.3 常用 Supabase 操作速查

```javascript
// --- Auth ---
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()
supabase.auth.getSession()
supabase.auth.getUser()
supabase.auth.onAuthStateChange((event, session) => { ... })

// --- Database ---
supabase.from('table').select('*')
supabase.from('table').select('*').eq('col', value)
supabase.from('table').select('*').order('col', { ascending: false })
supabase.from('table').select('*').range(0, 9)  // 分页 0-9
supabase.from('table').insert({ col: 'val' })
supabase.from('table').upsert({ id: 1, col: 'val' }, { onConflict: 'id' })
supabase.from('table').update({ col: 'new_val' }).eq('id', 1)
supabase.from('table').delete().eq('id', 1)
supabase.from('table').select('*', { count: 'exact', head: true }) // 仅计数

// --- Storage ---
supabase.storage.from('bucket').upload('path/file.jpg', file)
supabase.storage.from('bucket').getPublicUrl('path/file.jpg')
supabase.storage.from('bucket').remove(['path/file.jpg'])
supabase.storage.from('bucket').list('folder')

// --- Realtime ---
supabase.channel('name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table' }, callback)
  .subscribe()
```

### 15.4 安全注意事项

1. **anon key vs service_role key**：
   - anon key 可安全暴露在前端代码中（受 RLS 策略限制）
   - service_role key 可绕过 RLS，**绝对不能**出现在前端代码中
   - GitHub Actions 中只使用 anon key 即可（构建时注入环境变量）

2. **RLS 策略**：
   - 所有表默认启用 RLS，拒绝所有操作
   - 显式创建 SELECT 策略允许公开读取
   - 显式创建 INSERT/UPDATE/DELETE 策略仅允许认证用户

3. **密码安全**：
   - 管理员密码强度 ≥ 16 位，含大小写字母+数字+符号
   - 不共享管理员账号，仅个人使用

4. **环境变量**：
   - .env 文件加入 .gitignore（不上传 Git）
   - 生产环境变量通过 GitHub Actions Secrets 注入

### 15.5 故障排查指南

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 公开页加载无数据 | RLS 策略未创建 | 检查 SQL Editor 确认策略已执行 |
| 登录后无法编辑 | JWT 未正确附加 | 检查 Supabase 客户端 auth 配置 |
| 资源上传失败 | Storage Bucket 非 Public | 确认 Bucket 设置中 "Public bucket" 开启 |
| 自定义域名 404 | CNAME 或 DNS 未正确配置 | 检查 DNS CNAME 记录指向 `<user>.github.io` |
| HTTPS 不生效 | 证书签发中 | 等待 5-30 分钟，GitHub Pages 自动处理 |
| 编辑器保存后主页不变 | 缓存未失效 | 调用 pageConfigStore.invalidate() |
| SPA 路由刷新 404 | GitHub Pages 无 history fallback | 确保 404.html 与 index.html 相同（已通过构建脚本处理） |

---

> **文档维护**: 本文档随项目迭代持续更新。所有重大架构变更需同步更新此文档。
>
> **最后更新**: 2026-07-12
