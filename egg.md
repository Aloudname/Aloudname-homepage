# egg.md: About 页隐藏粒子小游戏——技术架构设计

> **代号**: ParticleGame
> **位置**: About 页（`/about`）顶部向上滚动触发
> **触发方式**: 鼠标滚轮向上 + 超过弹性阈值

---

## 目录

1. [需求分析](#1-需求分析)
2. [交互流程](#2-交互流程)
3. [组件架构](#3-组件架构)
4. [核心算法](#4-核心算法)
5. [数据流](#5-数据流)
6. [性能与内存策略](#6-性能与内存策略)
7. [过渡动画设计](#7-过渡动画设计)
8. [文件清单](#8-文件清单)
9. [实施步骤](#9-实施步骤)

---

## 1. 需求分析

### 1.1 触发条件

```
用户在 /about 页面，scrollTop === 0 时，继续向上滚动鼠标滚轮
  ├── 0 ~ THRESHOLD(150px 等效): 弹性阻尼，越往上越难拉，松手弹回
  └── >= THRESHOLD: 阻尼释放 → 游戏面板从顶部滑入
```

### 1.2 游戏规则

| 元素 | 行为 |
|------|------|
| 粒子 | 弹性碰撞边界，无摩擦阻尼，鼠标引力牵引 |
| 容器 | 不断运动（正弦轨迹或随机游走），捕获粒子 |
| 计分 | 粒子进入容器区域 → +1 分，粒子消除 |
| 生成速率 | `baseRate + score * multiplier`，越玩越快 |

### 1.3 粒子特殊属性（仅游戏内）

| 属性 | 游戏内 | 普通 About 页 |
|------|--------|-------------|
| 边界处理 | 弹性碰撞反弹 | 飞出后替换新粒子 |
| 阻尼 | **无**（`damp = 1.0`） | `damp = 0.995`（快粒子 0.999） |
| 生成速率 | 随分数递增 | 固定 `spawnRate` |
| 粒子数量 | 随速率动态增长 | 固定 `maxCount` |

---

## 2. 交互流程

```
┌─────────────────────────────────────────────────────────────┐
│                    用户交互状态机                             │
│                                                             │
│  [IDLE] ──scrollTop>0──► [NORMAL]                           │
│    │                         │                              │
│    │ scrollTop===0           │ scrollTop===0                │
│    │ + wheel ΔY < 0          │ + wheel ΔY < 0               │
│    ▼                         ▼                              │
│  [PULLING] ◄──────────── [PULLING]                          │
│    │                                                         │
│    │ overscroll > THRESHOLD                                  │
│    ▼                                                         │
│  [RELEASED] → 游戏面板滑入 → [PLAYING]                       │
│                                    │                         │
│    Esc / 向下滚过面板 / 关闭按钮    │                         │
│                                    ▼                         │
│                              [CLOSING] → 面板滑出 → [IDLE]   │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 弹性阻尼手感

```javascript
// 弹簧物理模型
overscroll += abs(wheelDeltaY) * 0.8    // 累积上滚量
overscroll *= 0.95                       // 自然衰减（松手后回弹）

const resistance = 1 - Math.min(overscroll / THRESHOLD, 1) * 0.9
// resistance 从 1.0 降到 0.1，越拉越难拉

if (overscroll >= THRESHOLD) {
  // 释放！进入游戏
  activateGame()
  overscroll = 0
}
```

### 2.2 游戏面板生命周期

```
用户触发 → v-if=true → 组件 mounted
  ├── 创建 Canvas
  ├── 启动 requestAnimationFrame 循环
  ├── 注册 document mousemove 监听
  └── 游戏开始

用户关闭 → v-if=false → 组件 destroyed
  ├── cancelAnimationFrame
  ├── removeEventListener
  ├── 清空粒子数组
  └── Canvas 被 GC
```

---

## 3. 组件架构

### 3.1 新增组件

```
src/views/public/
  └── ParticleGame.vue          ← 游戏主组件（懒加载）

src/views/FirstView/
  └── （修改）FirstView.vue      ← 添加滚轮监听 + 游戏面板挂载点
```

### 3.2 ParticleGame.vue 结构

```html
<template>
  <div class="game-panel" :class="{ active: visible }">
    <!-- 背景图层 -->
    <div class="game-bg" :style="bgStyle"></div>

    <!-- 渐变层 -->
    <div class="game-gradient" :style="gradientStyle"></div>

    <!-- 游戏 Canvas -->
    <canvas ref="gameCanvas" class="game-canvas"></canvas>

    <!-- UI 叠加层 -->
    <div class="game-ui">
      <div class="game-score">{{ score }}</div>
      <div class="game-hint">移动鼠标牵引粒子到容器中</div>
      <button class="game-close" @click="$emit('close')">✕</button>
    </div>

    <!-- 目标容器（CSS 渲染 + 运动） -->
    <div class="game-target" ref="target" :style="targetStyle"></div>
  </div>
</template>
```

### 3.3 属性/事件接口

```javascript
// ParticleGame.vue
props: {
  bgImage:    String,   // 背景图 URL（从 page_config 加载）
  gradient:   Array,    // 渐变色数组
  particleColor: String, // 粒子颜色
  particleMass: Number,  // 粒子质量
  cursorMass:  Number,   // 鼠标引力质量
  gravityRange: Number,  // 引力范围
}
emits: ['close', 'score-change']
expose: { reset, pause, resume }
```

### 3.4 FirstView 集成点

```html
<!-- FirstView.vue 模板末尾 -->
<transition name="game-reveal">
  <ParticleGame
    v-if="gameActive"
    :bgImage="gameBgImage"
    :gradient="gameGradient"
    @close="gameActive = false"
  />
</transition>
```

---

## 4. 核心算法

### 4.1 弹性碰撞

```javascript
// 粒子帧更新（游戏模式）
for (const p of particles) {
  // 鼠标引力（与普通高级粒子一致）
  if (mouse.active) {
    const dx = mouse.x - p.x, dy = mouse.y - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < gravityRange && dist > 1) {
      const force = (gStrength * cursorMass * pMass) / (dist * dist)
      p.vx += (dx / dist) * force / pMass
      p.vy += (dy / dist) * force / pMass
    }
  }

  // ★ 无阻尼
  // （不乘 damp）

  // ★ 弹性碰撞边界
  p.x += p.vx
  p.y += p.vy

  if (p.x <= 0)        { p.x = 0;        p.vx *= -1 }
  if (p.x >= width)    { p.x = width;    p.vx *= -1 }
  if (p.y <= 0)        { p.y = 0;        p.vy *= -1 }
  if (p.y >= height)   { p.y = height;   p.vy *= -1 }
}
```

### 4.2 容器运动（正弦轨迹）

```javascript
// 容器的运动路径
const targetRadius = 40 // 捕获半径
const target = {
  x: width/2  + Math.sin(elapsed * 0.8)  * width * 0.3,
  y: height/2 + Math.cos(elapsed * 0.55) * height * 0.25,
  r: targetRadius,
}

// 碰撞检测
for (let i = particles.length - 1; i >= 0; i--) {
  const p = particles[i]
  const dx = target.x - p.x, dy = target.y - p.y
  if (Math.sqrt(dx*dx + dy*dy) < target.r + p.size) {
    // 捕获！
    particles.splice(i, 1)
    score++
    spawnCaptureEffect(p.x, p.y) // 粒子爆发特效
  }
}
```

### 4.3 生成速率递增

```javascript
const baseRate = 2       // 基础: 每秒 2 个
const rateScale = 0.3    // 每分增加 0.3 个/秒
const currentRate = baseRate + score * rateScale

if (particles.length < currentRate * 10) {  // 上限 = 速率 × 10
  spawnTimer += dt
  while (spawnTimer > 1 / currentRate) {
    particles.push(spawnParticle())
    spawnTimer -= 1 / currentRate
  }
}
```

### 4.4 粒子视觉效果

```javascript
// 绘制: 速度越快越亮
for (const p of particles) {
  const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy)
  const alpha = Math.min(1, 0.3 + speed / 8)
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2)
  ctx.fill()

  // 拖尾 (speed-dependent)
  // (与高级粒子相同逻辑)
}
```

---

## 5. 数据流

```
FirstView.vue
  │
  ├── wheel event → overscroll 计算
  │     │
  │     └── overscroll >= THRESHOLD → this.gameActive = true
  │                                        │
  │                                        ▼
  │                              <ParticleGame v-if="gameActive" />
  │                                        │
  │                                        ├── created(): 从 page_config 读 about.game_*
  │                                        ├── mounted(): 创建 Canvas, 启动 RAF
  │                                        │     │
  │                                        │     ├── document.addEventListener('mousemove')
  │                                        │     ├── requestAnimationFrame(gameLoop)
  │                                        │     └── 初始化 target 位置
  │                                        │
  │                                        └── destroyed(): 清理所有资源
  │
  └── watch gameActive: false → 恢复 about 页正常滚动
```

### 5.1 page_config 扩展

```javascript
// about section 新增 key:
{
  section: 'about',
  key: 'game_bg_image',
  value: 'https://...'       // 游戏背景图
},
{
  section: 'about',
  key: 'game_gradient',
  value: ['#1a1a2e', '#16213e']  // 游戏渐变
},
{
  section: 'about',
  key: 'game_particle_color',
  value: '#00ff88'           // 游戏粒子颜色
},
{
  section: 'about',
  key: 'game_enabled',
  value: true                // 开关（可在 AboutEditor 中控制）
}
```

### 5.2 AboutEditor 扩展

在 AboutEditor 中新增一个折叠面板 "🎮 隐藏游戏设置"：

```
🎮 隐藏游戏设置  [启用/禁用]
├── 背景图 URL    [input + asset picker]
├── 渐变颜色      [color pickers]
├── 粒子颜色      [color picker]
└── 触发灵敏度    [slider: 低/中/高]
```

---

## 6. 性能与内存策略

### 6.1 懒加载

```javascript
// FirstView.vue 中延迟导入游戏组件
components: {
  ParticleGame: () => import('@/views/public/ParticleGame.vue')
}
```

Webpack 将其拆分为独立 chunk。用户不触发彩蛋 = 永远不下载游戏代码。

### 6.2 生命周期隔离

```
gameActive === false:
  ✗ 无 Canvas
  ✗ 无 RAF 循环
  ✗ 无 mousemove 监听
  ✗ 粒子数组为空
  内存占用: 0

gameActive === true:
  ✓ Canvas 分配 (~全屏分辨率)
  ✓ RAF 循环 (~60fps 单帧约 1-3ms)
  ✓ 粒子数组 (最多约 100 个对象)
  内存占用: ~5-10MB
```

### 6.3 粒子数量上限

```javascript
const MAX_PARTICLES = Math.min(currentRate * 10, 200)
// 即使 rate 飙升（高分），粒子不会超过 200 个
```

### 6.4 低性能设备降级

```javascript
// 检测帧率，低于 30fps 时减少粒子
if (deltaTime > 33) {
  // 跳帧或减少生成速率
  effectiveRate *= 0.5
}
```

---

## 7. 过渡动画设计

### 7.1 进入: 弹簧释放 + 面板滑入

```scss
.game-reveal-enter-active {
  transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
  // 从 -100vh 滑入到 0
}
.game-reveal-enter {
  transform: translateY(-100vh);
}

// 同时: 背景图 opacity 渐变
.game-bg {
  transition: opacity 0.8s ease 0.3s;
}
.game-reveal-enter .game-bg {
  opacity: 0;
}

// 计分板 scale 弹入
.game-score {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s;
}
.game-reveal-enter .game-score {
  transform: scale(0);
}
```

### 7.2 退出: 面板滑出

```scss
.game-reveal-leave-active {
  transition: transform 0.4s ease-in;
}
.game-reveal-leave-to {
  transform: translateY(-100vh);
}
```

### 7.3 视觉层次

```
z-index 布局:
  4  .game-ui         (分数/HUD)
  3  .game-target     (捕获容器)
  2  .game-canvas     (粒子)
  1  .game-gradient   (渐变层)
  0  .game-bg         (背景图)
 -1  .aboutBox 内容   (About 页, 游戏下方淡出)
```

---

## 8. 文件清单

| 文件 | 动作 | 说明 |
|------|------|------|
| `src/views/public/ParticleGame.vue` | **新建** | 游戏主组件（~300 行） |
| `src/views/FirstView/FirstView.vue` | **修改** | +滚轮监听 +游戏挂载点 +overscroll 状态（~30 行 diff） |
| `src/views/FirstView/css/FirstView.scss` | **修改** | +game-reveal 过渡 +游戏面板样式（~80 行） |
| `src/views/admin/AboutEditor.vue` | **修改** | +游戏设置面板（~40 行） |

无后端改动，无新依赖。

---

## 9. 实施步骤

| 步骤 | 内容 | 预估 |
|------|------|------|
| **S1** | FirstView 添加 `wheel` 监听 + overscroll 弹簧物理 | 30min |
| **S2** | 创建 ParticleGame.vue（Canvas + 弹性碰撞 + 无阻尼 + 容器 + 计分） | 2h |
| **S3** | 过渡动画（panel 滑入/滑出 + UI 弹入） | 30min |
| **S4** | AboutEditor 添加游戏配置 panel | 30min |
| **S5** | 联调 + 边界处理（面板关闭/返回/刷新保留状态） | 30min |
| **S6** | 性能测试（200 粒子 frame time < 8ms） | 30min |

**总预估**: 4-5 小时

---

> **决策点**: 是否开始实施？
