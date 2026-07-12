<!--
  动态背景组件 v3
  z-index 层级（从底到顶）：
    背景图(0) → Banner图(0) → 视频(0) → 渐变(0) → 遮罩(0)
    → 页面内容(#app z-index:1)
    → 基础粒子(3) → 高级粒子(3)
    → 光标特效(9999)
-->
<template>
  <div style="display:contents">
    <!-- ====== 底层: 静态图层 (z:0) ====== -->
    <div class="bg-layers">
      <div v-if="layers.image.enabled && layers.image.url" class="bg-image" :style="imageStyle('image')"></div>
      <div v-if="layers.banner.enabled && layers.banner.url" class="bg-image" :style="imageStyle('banner')"></div>
      <video v-if="layers.video.enabled && layers.video.url" class="bg-video" :src="layers.video.url"
        autoplay loop muted playsinline :style="{ opacity: layers.video.opacity }"></video>
    </div>

    <!-- ====== 中层: 渐变+遮罩 (z:2, 覆盖页面内容) ====== -->
    <div class="bg-overlays">
      <div v-if="layers.gradient.enabled && layers.gradient.colors.length"
        class="bg-gradient" :style="{ background: gradientStyle, opacity: layers.gradient.opacity }"></div>
      <div class="bg-overlay" :style="{ background: `rgba(0,0,0,${overlayOpacity})` }"></div>
    </div>

    <!-- ====== 顶层: 粒子 (z:3) ====== -->
    <div class="bg-particles">
      <canvas
        ref="particleCanvas"
        v-if="layers.basicParticles.enabled"
        class="bg-canvas"
        :style="{ opacity: layers.basicParticles.opacity }"
      ></canvas>

      <canvas
        ref="advancedCanvas"
        v-if="layers.advancedParticles.enabled"
        class="bg-canvas"
        :style="{ opacity: layers.advancedParticles.opacity }"
      ></canvas>
    </div>
  </div>
</template>

<script>

const DEFAULT_LAYER = {
  image:   { enabled: true,  url: '', opacity: 1, panSpeed: 0 },
  banner:  { enabled: false, url: '', opacity: 1, panSpeed: 0 },
  video:   { enabled: false, url: '', opacity: 1 },
  gradient:{ enabled: false, colors: [], opacity: 1 },
  basicParticles: {
    enabled: false, opacity: 1, count: 80, color: '#ffffff',
    speed: 1.5, shape: 'circle', connectDistance: 150, maxRadius: 3,
  },
  advancedParticles: {
    enabled: false, opacity: 1, maxCount: 60, spawnRate: 0.5,
    particleMass: 1, cursorMass: 50, gravityRange: 200,
    gravityStrength: 0.5, size: 4, color: '#ff6b9d', trailLength: 5,
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
      imgOffsets: { image: { x: 0, y: 0 }, banner: { x: 0, y: 0 } },
      basicParticles: [], basicAnimId: null, basicCtx: null, basicWidth: 0, basicHeight: 0,
      advancedParticles: [], advancedAnimId: null, advancedCtx: null,
      advancedWidth: 0, advancedHeight: 0,
      advancedMouse: { x: -9999, y: -9999, active: false },
      advancedElapsed: 0, advancedLastTime: 0,
    }
  },

  computed: {
    gradientStyle() {
      const c = this.layers.gradient.colors
      if (c.length >= 2) return `linear-gradient(135deg, ${c.join(', ')})`
      return c[0] || '#1a1a2e'
    },
  },

  watch: {
    config: { immediate: true, deep: true,
      handler(val) { if (val && Object.keys(val).length) this.applyConfig(val) },
    },
    'layers.image.panSpeed'()  { this.startPanning('image') },
    'layers.banner.panSpeed'() { this.startPanning('banner') },
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
    if (this.layers.basicParticles.enabled) this.$nextTick(() => this.initBasicParticles())
    if (this.layers.advancedParticles.enabled) this.$nextTick(() => this.initAdvancedParticles())
    this.startPanning('image')
    this.startPanning('banner')
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.stopPanning('image')
    this.stopPanning('banner')
    this.destroyBasicParticles()
    this.destroyAdvancedParticles()
  },

  methods: {
    // ===== 样式 =====
    imageStyle(layer) {
      const s = this.layers[layer]
      const o = this.imgOffsets[layer]
      return {
        backgroundImage: `url(${s.url})`,
        opacity: s.opacity,
        backgroundSize: s.panSpeed > 0 ? '120% auto' : 'cover',
        backgroundPosition: `${50 + o.x}% ${50 + o.y}%`,
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    },

    // ===== 配置 =====
    applyConfig(cfg) {
      if (!cfg || !Object.keys(cfg).length) return
      try {
        if (cfg.type && !cfg.layers) this.migrateOldConfig(cfg)
        if (cfg.layers) {
          for (const key of Object.keys(DEFAULT_LAYER)) {
            if (cfg.layers[key] && typeof cfg.layers[key] === 'object') {
              this.$set(this.layers, key, { ...this.layers[key], ...cfg.layers[key] })
            }
          }
        }
        if (cfg.overlay_opacity !== undefined) this.overlayOpacity = cfg.overlay_opacity
      } catch (err) { console.warn('[ParticleBg] applyConfig:', err.message) }

      this.$nextTick(() => {
        if (this.layers.basicParticles.enabled) this.initBasicParticles()
        else this.destroyBasicParticles()
        if (this.layers.advancedParticles.enabled) this.initAdvancedParticles()
        else this.destroyAdvancedParticles()
        this.startPanning('image')
        this.startPanning('banner')
      })
    },

    migrateOldConfig(cfg) {
      for (const k of Object.keys(this.layers)) {
        if (this.layers[k] && typeof this.layers[k].enabled === 'boolean') {
          this.$set(this.layers[k], 'enabled', false)
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

    // ===== 平移动画 =====
    startPanning(layer) {
      this.stopPanning(layer)
      const speed = this.layers[layer].panSpeed || 0
      if (speed <= 0) return
      let elapsed = 0
      const key = '_pan_' + layer
      const animate = () => {
        elapsed += 0.016
        this.imgOffsets[layer].x = Math.sin(elapsed * speed * 0.1) * 5
        this.imgOffsets[layer].y = Math.cos(elapsed * speed * 0.07) * 3
        this[key] = requestAnimationFrame(animate)
      }
      this[key] = requestAnimationFrame(animate)
    },
    stopPanning(layer) {
      const key = '_pan_' + layer
      if (this[key]) { cancelAnimationFrame(this[key]); this[key] = null }
    },

    // ===== 基础粒子 =====
    initBasicParticles() {
      this.destroyBasicParticles()
      const canvas = this.$refs.particleCanvas
      if (!canvas) return
      this.basicCtx = canvas.getContext('2d')
      this.basicWidth = canvas.width = window.innerWidth
      this.basicHeight = canvas.height = window.innerHeight
      this.basicParticles = []
      const cfg = this.layers.basicParticles
      for (let i = 0; i < cfg.count; i++) {
        this.basicParticles.push({
          x: Math.random() * this.basicWidth, y: Math.random() * this.basicHeight,
          vx: (Math.random() - 0.5) * cfg.speed, vy: (Math.random() - 0.5) * cfg.speed,
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
      for (let i = 0; i < this.basicParticles.length; i++) {
        for (let j = i + 1; j < this.basicParticles.length; j++) {
          const dx = this.basicParticles[i].x - this.basicParticles[j].x
          const dy = this.basicParticles[i].y - this.basicParticles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < cfg.connectDistance) {
            ctx.strokeStyle = cfg.color
            ctx.globalAlpha = (1 - dist / cfg.connectDistance) * 0.4
            ctx.beginPath()
            ctx.moveTo(this.basicParticles[i].x, this.basicParticles[i].y)
            ctx.lineTo(this.basicParticles[j].x, this.basicParticles[j].y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }
      for (const p of this.basicParticles) {
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        if (cfg.shape === 'circle') ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        else ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)
        ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > this.basicWidth) p.vx *= -1
        if (p.y < 0 || p.y > this.basicHeight) p.vy *= -1
      }
      this.basicAnimId = requestAnimationFrame(() => this.basicFrame())
    },

    destroyBasicParticles() {
      if (this.basicAnimId) { cancelAnimationFrame(this.basicAnimId); this.basicAnimId = null }
      this.basicParticles = []
    },

    // ===== 高级粒子 =====
    onAdvMouseMove(e) {
      this.advancedMouse.x = e.clientX
      this.advancedMouse.y = e.clientY
      this.advancedMouse.active = true
    },
    onAdvMouseLeave() { this.advancedMouse.active = false },

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
      document.addEventListener('mousemove', this.onAdvMouseMove)
      document.addEventListener('mouseleave', this.onAdvMouseLeave)
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

      const target = cfg.maxCount
      const toAdd = Math.min(Math.floor(this.advancedElapsed * cfg.spawnRate), target - this.advancedParticles.length)
      for (let i = 0; i < toAdd; i++) this.advancedParticles.push(this.spawnParticle(cfg))
      if (toAdd > 0) this.advancedElapsed = 0

      for (let i = this.advancedParticles.length - 1; i >= 0; i--) {
        const p = this.advancedParticles[i]
        if (p.x < -50 || p.x > this.advancedWidth + 50 || p.y < -50 || p.y > this.advancedHeight + 50) {
          this.advancedParticles[i] = this.spawnParticle(cfg)
        }
      }

      const mouse = this.advancedMouse
      for (const p of this.advancedParticles) {
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < cfg.gravityRange && dist > 1) {
            const force = (cfg.gravityStrength * cfg.cursorMass * cfg.particleMass) / (dist * dist)
            p.vx += (dx / dist) * force / cfg.particleMass
            p.vy += (dy / dist) * force / cfg.particleMass
          }
        }
        const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const damp = curSpeed > 3 ? 0.999 : 0.995
        p.vx *= damp; p.vy *= damp
        p.x += p.vx; p.y += p.vy

        ctx.fillStyle = cfg.color
        ctx.globalAlpha = Math.min(1, p.life / 3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, cfg.size, 0, Math.PI * 2)
        ctx.fill()

        const dynLen = Math.ceil(curSpeed * 3)
        const maxLen = cfg.trailLength > 0 ? Math.max(cfg.trailLength, dynLen) : dynLen
        p.trail.push({ x: p.x, y: p.y })
        while (p.trail.length > Math.min(maxLen, 30)) p.trail.shift()
        for (let t = 0; t < p.trail.length; t++) {
          const tp = p.trail[t]
          ctx.fillStyle = cfg.color
          ctx.globalAlpha = (t / p.trail.length) * 0.3
          ctx.beginPath()
          ctx.arc(tp.x, tp.y, cfg.size * (t / p.trail.length), 0, Math.PI * 2)
          ctx.fill()
        }
        p.life += dt
      }
      ctx.globalAlpha = 1
      this.advancedAnimId = requestAnimationFrame((t) => this.advancedFrame(t))
    },

    spawnParticle(cfg) {
      const edge = Math.floor(Math.random() * 4)
      let x, y, vx, vy
      const roll = Math.random()
      const speed = roll < 0.15 ? 3 + Math.random() * 7
        : roll < 0.45 ? 1 + Math.random() * 3
        : 0.1 + Math.random() * 1.2
      const angle = Math.random() * Math.PI * 2
      switch (edge) {
        case 0: x = Math.random() * this.advancedWidth; y = -10
          vx = Math.cos(angle) * speed; vy = Math.abs(Math.sin(angle)) * speed; break
        case 1: x = this.advancedWidth + 10; y = Math.random() * this.advancedHeight
          vx = -Math.abs(Math.cos(angle)) * speed; vy = Math.sin(angle) * speed; break
        case 2: x = Math.random() * this.advancedWidth; y = this.advancedHeight + 10
          vx = Math.cos(angle) * speed; vy = -Math.abs(Math.sin(angle)) * speed; break
        default: x = -10; y = Math.random() * this.advancedHeight
          vx = Math.abs(Math.cos(angle)) * speed; vy = Math.sin(angle) * speed
      }
      return { x, y, vx, vy, trail: [], life: 0 }
    },

    destroyAdvancedParticles() {
      if (this.advancedAnimId) { cancelAnimationFrame(this.advancedAnimId); this.advancedAnimId = null }
      this.advancedParticles = []
      this.advancedElapsed = 0
      document.removeEventListener('mousemove', this.onAdvMouseMove)
      document.removeEventListener('mouseleave', this.onAdvMouseLeave)
    },

    handleResize() {
      if (this.layers.basicParticles.enabled) this.initBasicParticles()
      if (this.layers.advancedParticles.enabled) {
        const c = this.$refs.advancedCanvas
        if (c) { c.width = window.innerWidth; c.height = window.innerHeight }
        this.advancedWidth = window.innerWidth
        this.advancedHeight = window.innerHeight
      }
    },
  },
}
</script>

<style lang="scss">
// display:contents 根元素不创建盒模型，下面两个子元素各自独立 fixed，z-index 作用到视口级

// ====== 底层：静态图层 (fixed, z:0) ======
.bg-layers {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  background: #1a1a2e;
}

.bg-image {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

.bg-video {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}

.bg-gradient {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

// ====== 中层：渐变+遮罩 (fixed, z:1) ======
.bg-overlays {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  z-index: 1;
}

.bg-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

// ====== 顶层：粒子 (fixed, z:2, 在渐变之上但内容之下) ======
.bg-particles {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  z-index: 2;
}

.bg-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}
</style>
