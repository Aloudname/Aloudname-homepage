# improve_1: 渲染与性能优化方案

> **状态**: 方案阶段（待实施）
> **范围**: 全站响应式布局 / 页面过渡动画 / About 页元素缩放 / Banner 高度 / 加载性能

---

## 目录

1. [问题 (1): 手机端/平板端响应式布局](#1-手机端平板端响应式布局)
2. [问题 (2): 页面切换过渡动画](#2-页面切换过渡动画)
3. [问题 (3): About 页元素放大](#3-about-页元素放大)
4. [问题 (4): About 页 Banner 高度优化](#4-about-页-banner-高度优化)
5. [问题 (5): 资源加载性能](#5-资源加载性能)
6. [实施顺序与优先级](#6-实施顺序与优先级)

---

## 1. 手机端/平板端响应式布局

### 1.1 现状分析

| 文件 | 问题 |
|------|------|
| `HomeView.scss` | `width: 100vw; height: 100vh` 写死全屏，小屏下头像/按钮会溢出或过小；`hero-nav` 用 `padding: 24px 48px` 在小屏挤压 |
| `FirstView.scss` | `.mainBox { width: 75% }` 固定百分比，`768px` 以下侧边栏和主内容挤成一团；`.two-col` 双栏在小屏无法换行；`.asideBoxFix` 用 `right: calc(...)` 固定定位，手机端完全错位 |
| `BlogView.vue` | `.mainBox { width: 70% }` 同样问题 |
| `PostView.vue` | `.post-content-wrapper { width: 70% }` 同上 |
| `bannerView` | `.bannerBox { height: 100vh }` 无断点变化 |
| `particleBg` | Canvas 尺寸随 `window.innerWidth/innerHeight`，但粒子数量没有随屏幕减小而降低 |

### 1.2 优化方案

**核心思路**：引入统一的 SCSS 断点 mixin，所有页面按 3 个断点适配。

```scss
// src/styles/mixins.scss （新建）

// 断点定义
$bp-tablet: 1024px;
$bp-phone: 768px;
$bp-small: 480px;

@mixin tablet  { @media (max-width: $bp-tablet) { @content; } }
@mixin phone   { @media (max-width: $bp-phone)  { @content; } }
@mixin small   { @media (max-width: $bp-small)  { @content; } }
```

**逐个页面的改动**：

#### HomeView (`src/views/HomeView/css/HomeView.scss`)

```scss
.hero-nav {
  padding: 16px 24px;
  @include phone { padding: 12px 16px; flex-direction: column; gap: 8px; }
}
.hero-logo {
  font-size: 28px;
  @include phone { font-size: 20px; }
}
.hero-links {
  gap: 28px;
  @include phone { gap: 16px; }
}
.hero-avatar {
  @include phone { .el-avatar { width: 100px !important; height: 100px !important; } }
}
.hero-name {
  font-size: 32px;
  @include phone { font-size: 22px; letter-spacing: 4px; }
}
.hero-btns {
  @include phone { flex-direction: column; align-items: center; }
}
.hero-btn {
  padding: 12px 28px;
  @include phone { padding: 10px 20px; font-size: 14px; }
}
.posts-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  @include phone { grid-template-columns: 1fr; gap: 16px; }
  @include tablet { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
}
```

#### FirstView (`src/views/FirstView/css/FirstView.scss`)

```scss
.mainBox {
  width: 75%;
  @include tablet { width: 90%; }
  @include phone {
    width: 94%;
    flex-direction: column;  // 侧边栏移到内容下方
    margin-top: -20px;
  }
}

// 双栏在小屏改为单栏
.two-col {
  grid-template-columns: 1fr 1fr;
  @include phone { grid-template-columns: 1fr; }
}

// 统计卡片在小屏两两排列
.stats-row {
  grid-template-columns: repeat(4, 1fr);
  @include phone { grid-template-columns: repeat(2, 1fr); }
}

// 侧边栏在平板以下改为横向 inline 布局
.asideBox, .asideBoxFix {
  width: 260px;
  @include tablet { width: 220px; }
  @include phone {
    width: 100%;
    position: static !important;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 16px;
    .asideImg { width: 80px; height: 80px; flex-shrink: 0; }
    .asideTile { margin-top: 0; font-size: 16px; }
    .asideTile1 { font-size: 12px; }
    .aside-extra { display: none; }
    .bottomImg { max-width: 120px; margin: 0 auto; }
  }
}

// 返回顶部按钮在小屏缩小
.go-top {
  bottom: 40px; right: 40px;
  @include phone { bottom: 16px; right: 16px; width: 36px; height: 36px; }
}
```

#### BannerView (`src/components/bannerView/index.vue`)

```scss
.bannerBox {
  height: 100vh;
  @include tablet { height: 70vh; }
  @include phone  { height: 60vh; }
}
.navBox {
  padding: 20px 35px;
  @include phone { padding: 10px 16px; flex-direction: column; text-align: center; }
}
.topTitle {
  font-size: 38px;
  @include phone { font-size: 22px; }
}
.centerTile {
  font-size: 38px;
  @include phone { font-size: 24px; line-height: 50vh; }
}
```

#### 粒子背景 (`src/components/particleBg/index.vue`)

```javascript
// 在 initBasicParticles() 中根据屏幕宽度调整粒子数量
initBasicParticles() {
  // ...
  const cfg = this.layers.basicParticles
  const width = window.innerWidth
  const scale = width < 480 ? 0.3 : width < 768 ? 0.5 : 1
  const count = Math.floor(cfg.count * scale)
  // ... 用 count 代替 cfg.count
}

// 同理 initAdvancedParticles() 中
const maxCount = Math.floor(cfg.maxCount * scale)
```

### 1.3 预期效果

| 断点 | 布局变化 |
|------|---------|
| >1024px | 现有桌面布局（不变） |
| 768-1024px (平板) | 宽度 90%，Banner 缩小到 70vh，侧边栏缩小，粒子减少 50% |
| 480-768px (手机横屏) | 宽度 94%，双栏变单栏，侧边栏移至底部横向排列，粒子减少 70% |
| <480px (手机竖屏) | 导航竖排，按钮堆叠，Banner 60vh，返回顶部按钮缩小 |

---

## 2. 页面切换过渡动画

### 2.1 现状分析

当前 `App.vue` 中：

```html
<transition
  appear
  name="animate__animated animate__bounce"
  enter-active-class="animate__backInUp animate__slow"
  leave-active-class="animate__fadeOutDownBig contron"
>
  <router-view :key="$route.path" />
</transition>
```

**问题**：
- `name` 属性设为 `"animate__animated animate__bounce"` 不符合 Vue transition 规范——`name` 只应用于 CSS class 前缀，不是 Animate.css 类名
- `animate__backInUp` 是"从下方弹入"，所有页面无论从哪来都从底部弹入，方向感缺失
- `animate__slow` 是 2s duration，对于页面切换太慢
- 没有区分前进/后退方向
- 离开动画 `fadeOutDownBig` 和进入动画 `backInUp` 同时播放，两个页面会同时在屏幕上（一个淡出下移，一个弹入），产生抖动

### 2.2 优化方案

使用路由级方向感知过渡，进入/离开使用不重叠的动画时序。

#### 新建 `src/mixins/pageTransition.js`

```javascript
/**
 * 页面过渡方向感知
 * 根据路由深度判断前进/后退
 */
export default {
  data() {
    return { transitionName: 'fade' }
  },
  watch: {
    $route(to, from) {
      // 简单启发式: URL 段数增加 = 前进, 减少 = 后退
      const toDepth = to.path.split('/').length
      const fromDepth = from.path.split('/').length
      this.transitionName = toDepth >= fromDepth ? 'slide-left' : 'slide-right'
    },
  },
}
```

#### 更新 `src/App.vue`

```html
<template>
  <div id="app">
    <!-- 背景/光标不变 -->
    <particleBg v-if="!isAdminRoute" :config="bgConfig" />
    <cursorEffect v-if="!isAdminRoute" :config="cursorConfig" />

    <!-- ★ 新过渡系统 -->
    <transition :name="transitionName" mode="out-in">
      <router-view :key="$route.fullPath" />
    </transition>

    <audio v-if="!isAdminRoute" :src="musicUrl" loop autoplay ref="au" />
  </div>
</template>

<script>
// ...
mixins: [pageTransition],
</script>

<style lang="scss">
// 前进: 从左滑入
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter {
  transform: translateX(40px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

// 后退: 从右滑入
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter {
  transform: translateX(-40px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

// 同级切换(如 tab): 淡入淡出
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
```

### 2.3 预期效果

| 导航场景 | 动画 |
|---------|------|
| `/` → `/about` | 页面从右滑入（slide-left 300ms） |
| `/about` → `/` | 页面从左滑入（slide-right 300ms） |
| 同级切换 | 淡入淡出（fade 250ms） |
| 过渡模式 | `mode="out-in"` 旧页完全退出后新页才进入，无重叠抖动 |

---

## 3. About 页元素放大

### 3.1 现状

| 元素 | 当前尺寸 | 问题 |
|------|---------|------|
| 统计卡片 `.stat-num` | `28px` | 在桌面端偏小，不够醒目 |
| 面板标题 `.panel-head` | `18px` | 偏小 |
| 项目名称 `.proj-name` | `14px` | 偏小 |
| 语言条 `.lang-info` | `13px` | 阅读吃力 |
| 活动时间线 `.act-item` | `13px` | 同上 |
| 侧边栏头像 | `90px` | 偏小 |

### 3.2 优化方案

桌面端整体放大 15-25%，平板/手机保持原比例。

```scss
// FirstView.scss 调整

.stat-num  { font-size: 36px; }      // 28→36  (+29%)
.stat-label{ font-size: 14px; }      // 13→14

.panel-head { font-size: 20px; }     // 18→20  (+11%)

.proj-name { font-size: 15px; }      // 14→15
.proj-desc { font-size: 13px; }      // 12→13

.lang-info  { font-size: 14px; }     // 13→14

.act-item   { font-size: 14px; }     // 13→14
.act-icon   { font-size: 17px; }     // 15→17

.asideBox .asideTile { font-size: 20px; }    // 18→20
.asideBox .asideTile1{ font-size: 14px; }    // 13→14

// 侧边栏头像默认大小调整
// FirstView.vue data() 中 sidebarAvatarSize: 90 → 110
```

### 3.3 预期效果

桌面端视觉元素整体放大 15-30%，信息层级更清晰，阅读不费力。平板/手机端保持现有比例不变（通过媒体查询复位）。

---

## 4. About 页 Banner 高度优化

### 4.1 现状

`bannerView` 组件的 `.bannerBox` 高度为 `100vh`，进入 About 页时整个屏幕被 Banner 占满，用户必须向下滚动才能看到主内容区域。

### 4.2 优化方案

**方案 A（推荐）：Banner 高度改为弹性值 + 内容部分露出**

```scss
// bannerView 组件
.bannerBox {
  height: 70vh;          // 桌面端 Banner 占 70%
  min-height: 400px;     // 最小保证标题可见
  @include phone {
    height: 50vh;
    min-height: 300px;
  }
}
```

同时在 About 页主内容区增加负 margin 上移（已在 `.mainBox { margin-top: -40px }` 中），使主内容"探入"Banner 底部，用户进入页面就能看到内容区域的顶部。

**方案 B（备选）：滚动提示增强**

在 Banner 底部增加更明显的向下滚动提示（脉冲动画箭头 + "了解更多"文字），引导用户滚动。此方案不改 Banner 高度，适合首页 Hero 保留全屏效果。

**About 页建议用方案 A**（缩小 Banner），首页保持方案 B（全屏 Hero + 滚动提示）。

### 4.3 预期效果

| 页面 | Banner 高度 | 首屏可见内容 |
|------|-----------|-------------|
| `/` 首页 | 100vh（不变） | Hero + 向下滚动提示 |
| `/about` | 70vh → 首屏即可看到统计卡片顶部的 30% |

---

## 5. 资源加载性能

### 5.1 现状分析

| 问题 | 影响 |
|------|------|
| `src/assets/` 下有 22 张背景图（合计 ~15MB），全部打包进 JS bundle | 首屏加载极慢（尤其移动网络） |
| 所有路由组件使用 `() => import()` 懒加载，但首屏仍加载了 `HomeView` + `particleBg` + `cursorEffect` | 首屏 JS ~2MB+ |
| 没有图片懒加载 / 现代格式（WebP/AVIF） | 用户看到图片前等待时间长 |
| 大图没有渐进式加载策略（先低清后高清） | 白屏时间长 |
| GitHub API 在每次页面加载时都获取，无缓存 | `/about` 每次访问都重新请求，增加等待 |

### 5.2 优化方案

#### 5.2.1 图片优化

```javascript
// vue.config.js 添加

chainWebpack: config => {
  // 小图 (< 10KB) 内联为 base64
  config.module.rule('images')
    .set('parser', { dataUrlCondition: { maxSize: 10 * 1024 } })

  // 启用 WebP 转换（需安装 imagemagick 或 sharp 做预转换）
  // 生产环境: 将所有 jpg/png 转为 WebP + 原图 fallback
}
```

**静态资源迁移计划**：

1. 将 `src/assets/bg*.jpg/png` 批量转为 WebP（体积减少 40-60%）
2. 上传到 Supabase Storage，从 CDN 加载，不再打包进 bundle
3. 修改 `particleBg` 和 `bannerView` 中的图片引用，使用 Supabase URL 而非 import

```bash
# 本地批量转换脚本
for f in src/assets/bg*.jpg; do
  convert "$f" -quality 80 "${f%.jpg}.webp"
done
```

#### 5.2.2 路由懒加载 + Prefetch 优化

当前 `vue.config.js` 未配置 prefetch。Vue CLI 默认对所有 async chunk 生成 `<link rel="prefetch">`，反而浪费带宽。

```javascript
// vue.config.js
chainWebpack: config => {
  // 移除所有 prefetch（按需加载，不预取）
  config.plugins.delete('prefetch')

  // 只对关键路由预取
  config.plugin('prefetch-home').use(require('webpack').PrefetchPlugin, [
    [{ context: 'src/views/HomeView' }]
  ])
}
```

#### 5.2.3 首屏关键 CSS 内联

```javascript
// vue.config.js
css: {
  extract: process.env.NODE_ENV === 'production' ? {
    filename: 'css/[name].[contenthash:8].css',
    chunkFilename: 'css/[name].[contenthash:8].css',
  } : false,
},
```

#### 5.2.4 GitHub 数据缓存

```javascript
// src/services/githubService.js 增加缓存层

const CACHE_KEY = 'gh_data'
const CACHE_TTL = 30 * 60 * 1000  // 30 分钟

async function fetchWithCache(key, fetcher) {
  const cached = localStorage.getItem(key)
  if (cached) {
    const { data, ts } = JSON.parse(cached)
    if (Date.now() - ts < CACHE_TTL) return data
  }
  const data = await fetcher()
  localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  return data
}

export async function getUserCached(username) {
  return fetchWithCache(`gh_user_${username}`, () => getUser(username))
}
export async function getReposCached(username) {
  return fetchWithCache(`gh_repos_${username}`, () => getRepos(username))
}
export async function getEventsCached(username) {
  return fetchWithCache(`gh_events_${username}`, () => getEvents(username))
}
```

在 `FirstView.vue` 中使用缓存版本：

```javascript
import { getUserCached, getReposCached, getEventsCached } from '@/services/githubService'

async loadGitHub() {
  const name = this.ghUsername
  // 使用缓存版本，30 分钟内不重复请求
  const [user, repos, events] = await Promise.all([
    getUserCached(name), getReposCached(name), getEventsCached(name),
  ])
  // ...
}
```

#### 5.2.5 Skeleton 占位

在 About 页 GitHub 数据加载时显示骨架屏而非空白 loading 图标，改善感知性能。

```html
<!-- FirstView.vue: 替换 loading 状态 -->
<div v-if="ghLoading" class="skeleton-grid">
  <div class="skel-card" v-for="n in 4" :key="n">
    <div class="skel-bar w60"></div>
    <div class="skel-bar w80"></div>
  </div>
</div>
```

```scss
// 骨架屏脉冲动画
.skel-card {
  background: rgba(255,255,255,0.04);
  border-radius: 14px;
  padding: 20px;
  .skel-bar {
    height: 14px;
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    margin: 8px 0;
    animation: pulse 1.5s infinite;
  }
  .w60 { width: 60%; } .w80 { width: 80%; }
}
@keyframes pulse {
  0%,100% { opacity: 0.3; }
  50%     { opacity: 0.6; }
}
```

### 5.3 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首屏 JS 体积 | ~2.1MB | ~800KB（图片外置 + 移除 prefetch） |
| 背景图加载 | 阻塞（bundle 内） | 异步 CDN（Supabase Storage） |
| 图片格式 | JPG/PNG | WebP（体积 -50%） |
| GitHub 数据请求 | 每次访问 | 30 分钟内走 localStorage 缓存 |
| 首屏可交互时间 | ~3-5s | ~1.5-2s |

---

## 6. 实施顺序与优先级

| 优先级 | 问题 | 预估工作量 | 影响面 |
|--------|------|-----------|--------|
| **P0** | (4) Banner 高度 — 改动最小，见效最快 | 0.5h | 仅 About 页 |
| **P0** | (5) GitHub 数据缓存 — 解决重复请求 | 0.5h | About 页 |
| **P1** | (3) 元素放大 — 纯 CSS 调整 | 0.5h | About 页 |
| **P1** | (2) 过渡动画 — 替换 transition 系统 | 1h | 全站 |
| **P1** | (1) 响应式 — 批量添加媒体查询 | 2h | 全站 |
| **P2** | (5) 图片外置 + WebP — 需预处理资源 | 1h | 全站 |
| **P2** | (5) 骨架屏 — 模板 + CSS | 0.5h | About 页 |
| **P2** | (5) Prefetch 优化 — webpack 配置 | 0.5h | 全站 |

**建议分两个迭代**：

- **Iteration 1** (约 1.5h): P0 项 (Banner 高度 + GitHub 缓存) + P1 项 (元素放大 + 过渡动画)
- **Iteration 2** (约 3.5h): P1 响应式 + P2 图片外置/WebP/骨架屏/Prefetch

---

> **决策点**：是否立即开始 Iteration 1？
