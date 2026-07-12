<!--
  动态背景组件 v2
  - 多图层叠加：图片/视频 + 粒子 + 渐变可同时渲染
  - 每层独立透明度控制
  - 高级粒子：鼠标引力捕获、边缘生成、数量渐进增长
  - 背景图缓慢平移（视差效果）
  - 配置从 page_config 的 background section 读取
-->
<template>
  <div class="particle-bg-wrapper" ref="wrapper">
    <!-- 图层1: 静态图片（支持缓慢平移） -->
    <div
      v-if="layers.image.enabled && layers.image.url"
      class="bg-image"
      :style="imageStyle"
    ></div>

    <!-- 图层2: 视频背景 -->
    <video
      v-if="layers.video.enabled && layers.video.url"
      class="bg-video"
      :src="layers.video.url"
      autoplay
      loop
      muted
      playsinline
      :style="{ opacity: layers.video.opacity }"
    ></video>

    <!-- 图层3: 渐变色 -->
    <div
      v-if="layers.gradient.enabled && layers.gradient.colors.length"
      class="bg-gradient"
      :style="{ background: gradientStyle, opacity: layers.gradient.opacity }"
    ></div>

    <!-- 图层4: 基础粒子 Canvas -->
    <canvas
      ref="particleCanvas"
      v-if="layers.basicParticles.enabled"
      class="bg-canvas"
      :style="{ opacity: layers.basicParticles.opacity }"
    ></canvas>

    <!-- 图层5: 高级粒子 Canvas（物理模拟） -->
    <canvas
      ref="advancedCanvas"
      v-if="layers.advancedParticles.enabled"
      class="bg-canvas"
      :style="{ opacity: layers.advancedParticles.opacity }"
      @mousemove="onAdvancedMouseMove"
      @mouseleave="onAdvancedMouseLeave"
    ></canvas>

    <!-- 遮罩层 -->
    <div
      class="bg-overlay"
      :style="{ background: `rgba(0,0,0,${overlayOpacity})` }"
    ></div>
  </div>
</template>

<script>

// 默认图层配置
const DEFAULT_LAYER = {
  image: { enabled: true, url: '', opacity: 1, panSpeed: 0 },
  video: { enabled: false, url: '', opacity: 1 },
  gradient: { enabled: false, colors: [], opacity: 1 },
  basicParticles: {
    enabled: false,
    opacity: 1,
    count: 80,
    color: '#ffffff',
    speed: 1.5,
    shape: 'circle',
    connectDistance: 150,
    maxRadius: 3,
  },
  advancedParticles: {
    enabled: false,
    opacity: 1,
    maxCount: 60,
    spawnRate: 0.5,
    particleMass: 1,
    cursorMass: 50,
    gravityRange: 200,
    gravityStrength: 0.5,
    size: 4,
    color: '#ff6b9d',
    trailLength: 5,
  },
}

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_LAYER))
}

export default {
  name: 'ParticleBg',

  props: {
    config: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      layers: cloneDefaults(),
      overlayOpacity: 0.4,
      imageOffsetX: 0,
      imageOffsetY: 0,
      basicParticles: [],
      basicAnimId: null,
      basicCtx: null,
      basicWidth: 0,
      basicHeight: 0,
      advancedParticles: [],
      advancedAnimId: null,
      advancedCtx: null,
      advancedWidth: 0,
      advancedHeight: 0,
      advancedMouse: { x: -9999, y: -9999, active: false },
      advancedElapsed: 0,
      advancedLastTime: 0,
    }
  },

  computed: {
    gradientStyle() {
      const c = this.layers.gradient.colors
      if (c.length >= 2) return `linear-gradient(135deg, ${c.join(', ')})`
      return c[0] || '#1a1a2e'
    },
    imageStyle() {
      const s = this.layers.image
      return {
        backgroundImage: `url(${s.url})`,
        opacity: s.opacity,
        backgroundSize: s.panSpeed > 0 ? '120% auto' : 'cover',
        backgroundPosition: `${50 + this.imageOffsetX}% ${50 + this.imageOffsetY}%`,
        backgroundRepeat: 'no-repeat',
      }
    },
  },

  // ★ 合并为单一 watch 块（之前两个会互相覆盖）
  watch: {
    config: {
      immediate: true,
      deep: true,
      handler(val) {
        if (val && Object.keys(val).length) {
          this.applyConfig(val)
        }
      },
    },
    'layers.image.panSpeed'() { this.initPanning() },
    'layers.basicParticles.enabled'(v) {
      if (v) this.$nextTick(() => this.initBasicParticles())
      else this.destroyBasicParticles()
    },
    'layers.advancedParticles.enabled'(v) {
      if (v) this.$nextTick(() => this.initAdvancedParticles())
      else this.destroyAdvancedParticles()
    },
  },

  mounted() {
    window.addEventListener('resize', this.handleResize)
    // 如果初始就有启用的粒子层，立即初始化
    if (this.layers.basicParticles.enabled) this.$nextTick(() => this.initBasicParticles())
    if (this.layers.advancedParticles.enabled) this.$nextTick(() => this.initAdvancedParticles())
    this.initPanning()
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.destroyBasicParticles()
    this.destroyAdvancedParticles()
  },

  methods: {
    // ========== 配置加载 ==========
    applyConfig(cfg) {
      if (!cfg || !Object.keys(cfg).length) return

      try {
        // 兼容旧版: 有 type 但没有 layers（从旧版编辑器保存的数据）
        if (cfg.type && !cfg.layers) {
          this.migrateOldConfig(cfg)
        }

        // 新版 layers 结构
        if (cfg.layers) {
          const src = cfg.layers
          for (const key of Object.keys(DEFAULT_LAYER)) {
            if (src[key] && typeof src[key] === 'object') {
              this.$set(this.layers, key, { ...this.layers[key], ...src[key] })
            }
          }
        }

        if (cfg.overlay_opacity !== undefined) {
          this.overlayOpacity = cfg.overlay_opacity
        }
      } catch (err) {
        console.warn('[ParticleBg] applyConfig 出错:', err.message)
      }

      // 根据最终配置决定初始化/销毁
      this.$nextTick(() => {
        if (this.layers.basicParticles.enabled) this.initBasicParticles()
        else this.destroyBasicParticles()
        if (this.layers.advancedParticles.enabled) this.initAdvancedParticles()
        else this.destroyAdvancedParticles()
        this.initPanning()
      })
    },

    // 兼容旧版单选 type 配置（只有一张图/视频/粒子）
    migrateOldConfig(cfg) {
      // 先全部关闭
      for (const k of Object.keys(this.layers)) {
        const obj = this.layers[k]
        if (obj && typeof obj.enabled === 'boolean') {
          this.$set(obj, 'enabled', false)
        }
      }
      if (cfg.type === 'image' && cfg.image_url) {
        this.$set(this.layers.image, 'enabled', true)
        this.$set(this.layers.image, 'url', cfg.image_url)
      } else if (cfg.type === 'video' && cfg.video_url) {
        this.$set(this.layers.video, 'enabled', true)
        this.$set(this.layers.video, 'url', cfg.video_url)
      } else if (cfg.type === 'particles') {
        this.$set(this.layers.basicParticles, 'enabled', true)
        if (cfg.particle_config) {
          Object.keys(cfg.particle_config).forEach(k => {
            this.$set(this.layers.basicParticles, k, cfg.particle_config[k])
          })
        }
      } else if (cfg.type === 'gradient' && cfg.gradient_colors) {
        this.$set(this.layers.gradient, 'enabled', true)
        this.$set(this.layers.gradient, 'colors', cfg.gradient_colors.filter(Boolean))
      }
    },

    // ========== 图片平移 ==========
    initPanning() {
      const speed = this.layers.image.panSpeed || 0
      if (speed <= 0) return

      let elapsed = 0
      const animate = (ts) => {
        elapsed += 0.016 // ~60fps
        // 缓慢正弦平移，速度可控
        this.imageOffsetX = Math.sin(elapsed * speed * 0.1) * 5
        this.imageOffsetY = Math.cos(elapsed * speed * 0.07) * 3
        this._panId = requestAnimationFrame(animate)
      }
      if (this._panId) cancelAnimationFrame(this._panId)
      this._panId = requestAnimationFrame(animate)
    },

    // ========== 基础粒子（原版连线粒子） ==========
    initBasicParticles() {
      this.destroyBasicParticles()
      const canvas = this.$refs.particleCanvas
      if (!canvas) return
      this.basicCtx = canvas.getContext('2d')
      this.basicWidth = canvas.width = window.innerWidth
      this.basicHeight = canvas.height = window.innerHeight

      const cfg = this.layers.basicParticles
      this.basicParticles = []
      for (let i = 0; i < cfg.count; i++) {
        this.basicParticles.push({
          x: Math.random() * this.basicWidth,
          y: Math.random() * this.basicHeight,
          vx: (Math.random() - 0.5) * cfg.speed,
          vy: (Math.random() - 0.5) * cfg.speed,
          radius: Math.random() * (cfg.maxRadius || 3) + 2,
        })
      }
      this.basicFrame()
    },

    basicFrame() {
      const ctx = this.basicCtx
      if (!ctx) return
      const cfg = this.layers.basicParticles
      ctx.clearRect(0, 0, this.basicWidth, this.basicHeight)

      // 连线
      for (let i = 0; i < this.basicParticles.length; i++) {
        for (let j = i + 1; j < this.basicParticles.length; j++) {
          const dx = this.basicParticles[i].x - this.basicParticles[j].x
          const dy = this.basicParticles[i].y - this.basicParticles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < cfg.connectDistance) {
            const alpha = (1 - dist / cfg.connectDistance) * 0.4
            ctx.strokeStyle = cfg.color
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.moveTo(this.basicParticles[i].x, this.basicParticles[i].y)
            ctx.lineTo(this.basicParticles[j].x, this.basicParticles[j].y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      // 绘制粒子
      for (const p of this.basicParticles) {
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        if (cfg.shape === 'circle') {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        } else {
          ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)
        }
        ctx.fill()
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > this.basicWidth) p.vx *= -1
        if (p.y < 0 || p.y > this.basicHeight) p.vy *= -1
      }

      this.basicAnimId = requestAnimationFrame(() => this.basicFrame())
    },

    destroyBasicParticles() {
      if (this.basicAnimId) { cancelAnimationFrame(this.basicAnimId); this.basicAnimId = null }
      this.basicParticles = []
    },

    // ========== 高级粒子（天体物理模拟） ==========
    onAdvancedMouseMove(e) {
      this.advancedMouse.x = e.clientX
      this.advancedMouse.y = e.clientY
      this.advancedMouse.active = true
    },
    onAdvancedMouseLeave() {
      this.advancedMouse.active = false
    },

    initAdvancedParticles() {
      this.destroyAdvancedParticles()
      const canvas = this.$refs.advancedCanvas
      if (!canvas) return
      this.advancedCtx = canvas.getContext('2d')
      this.advancedWidth = canvas.width = window.innerWidth
      this.advancedHeight = canvas.height = window.innerHeight
      this.advancedParticles = []
      this.advancedElapsed = 0
      this.advancedLastTime = performance.now()
      this.advancedFrame(performance.now())
    },

    advancedFrame(timestamp) {
      const ctx = this.advancedCtx
      if (!ctx) return
      const cfg = this.layers.advancedParticles

      const dt = Math.min((timestamp - this.advancedLastTime) / 1000, 0.1)
      this.advancedLastTime = timestamp
      this.advancedElapsed += dt

      ctx.clearRect(0, 0, this.advancedWidth, this.advancedHeight)

      // 渐进增加粒子数
      const target = cfg.maxCount
      const current = this.advancedParticles.length
      const shouldSpawn = Math.floor(this.advancedElapsed * cfg.spawnRate)
      const toAdd = Math.min(shouldSpawn, target - current)

      for (let i = 0; i < toAdd; i++) {
        this.advancedParticles.push(this.spawnAdvancedParticle(cfg))
      }
      if (toAdd > 0) this.advancedElapsed = 0

      // 补齐飞出页面的粒子
      for (let i = this.advancedParticles.length - 1; i >= 0; i--) {
        const p = this.advancedParticles[i]
        if (p.x < -50 || p.x > this.advancedWidth + 50 ||
            p.y < -50 || p.y > this.advancedHeight + 50) {
          // 替换为新粒子（从边缘飞入）
          this.advancedParticles[i] = this.spawnAdvancedParticle(cfg)
        }
      }

      // 物理更新
      const mouse = this.advancedMouse
      const gRange = cfg.gravityRange
      const gStrength = cfg.gravityStrength
      const cursorMass = cfg.cursorMass
      const pMass = cfg.particleMass

      for (const p of this.advancedParticles) {
        // 鼠标引力
        if (mouse.active) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < gRange && dist > 1) {
            const force = (gStrength * cursorMass * pMass) / (dist * dist)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            p.vx += fx / pMass
            p.vy += fy / pMass
          }
        }

        // 阻尼
        p.vx *= 0.995
        p.vy *= 0.995

        p.x += p.vx
        p.y += p.vy

        // 绘制粒子
        ctx.fillStyle = cfg.color
        ctx.globalAlpha = Math.min(1, p.life / 3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, cfg.size, 0, Math.PI * 2)
        ctx.fill()

        // 拖尾
        if (cfg.trailLength > 0) {
          p.trail.push({ x: p.x, y: p.y })
          if (p.trail.length > cfg.trailLength) p.trail.shift()
          for (let t = 0; t < p.trail.length; t++) {
            const tp = p.trail[t]
            const alpha = (t / p.trail.length) * 0.3
            ctx.fillStyle = cfg.color
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.arc(tp.x, tp.y, cfg.size * (t / p.trail.length), 0, Math.PI * 2)
            ctx.fill()
          }
        }

        p.life += dt
      }

      ctx.globalAlpha = 1
      this.advancedAnimId = requestAnimationFrame((t) => this.advancedFrame(t))
    },

    spawnAdvancedParticle(cfg) {
      // 从页面四边随机位置生成，向内飞入
      const edge = Math.floor(Math.random() * 4)
      let x, y, vx, vy
      const speed = 0.3 + Math.random() * 1.5
      const angle = Math.random() * Math.PI * 2

      switch (edge) {
        case 0: // 上边
          x = Math.random() * this.advancedWidth
          y = -10
          vx = Math.cos(angle) * speed
          vy = Math.abs(Math.sin(angle)) * speed
          break
        case 1: // 右边
          x = this.advancedWidth + 10
          y = Math.random() * this.advancedHeight
          vx = -Math.abs(Math.cos(angle)) * speed
          vy = Math.sin(angle) * speed
          break
        case 2: // 下边
          x = Math.random() * this.advancedWidth
          y = this.advancedHeight + 10
          vx = Math.cos(angle) * speed
          vy = -Math.abs(Math.sin(angle)) * speed
          break
        default: // 左边
          x = -10
          y = Math.random() * this.advancedHeight
          vx = Math.abs(Math.cos(angle)) * speed
          vy = Math.sin(angle) * speed
      }

      return { x, y, vx, vy, trail: [], life: 0 }
    },

    destroyAdvancedParticles() {
      if (this.advancedAnimId) { cancelAnimationFrame(this.advancedAnimId); this.advancedAnimId = null }
      this.advancedParticles = []
      this.advancedElapsed = 0
    },

    // ========== 通用 ==========
    handleResize() {
      if (this.layers.basicParticles.enabled) this.initBasicParticles()
      if (this.layers.advancedParticles.enabled) {
        this.advancedWidth = this.$refs.advancedCanvas?.width || window.innerWidth
        this.advancedHeight = this.$refs.advancedCanvas?.height || window.innerHeight
        if (this.$refs.advancedCanvas) {
          this.$refs.advancedCanvas.width = window.innerWidth
          this.$refs.advancedCanvas.height = window.innerHeight
          this.advancedWidth = window.innerWidth
          this.advancedHeight = window.innerHeight
        }
      }
    },
  },
}
</script>

<style lang="scss">
.particle-bg-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #1a1a2e; // 默认暗色底
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: background-position 0.5s linear;
}

.bg-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
