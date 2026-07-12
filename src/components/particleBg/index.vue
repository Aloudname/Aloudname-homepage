<!--
  粒子/动态背景组件
  支持类型: particles（粒子）| gradient（渐变）| image（静态图）| video（视频）
  配置从 page_config 的 background section 读取
-->
<template>
  <div class="particle-bg-wrapper" ref="wrapper">
    <!-- 静态图片背景 -->
    <div
      v-if="type === 'image' && imageUrl"
      class="bg-image"
      :style="{ backgroundImage: `url(${imageUrl})` }"
    ></div>

    <!-- 视频背景 -->
    <video
      v-if="type === 'video' && videoUrl"
      class="bg-video"
      :src="videoUrl"
      autoplay
      loop
      muted
      playsinline
    ></video>

    <!-- 渐变背景 -->
    <div
      v-if="type === 'gradient' && gradientColors.length"
      class="bg-gradient"
      :style="{ background: gradientStyle }"
    ></div>

    <!-- 粒子 Canvas -->
    <canvas
      ref="canvas"
      v-if="type === 'particles'"
      class="bg-canvas"
    ></canvas>

    <!-- 遮罩层 -->
    <div
      class="bg-overlay"
      :style="{ background: `rgba(0,0,0,${overlayOpacity})` }"
    ></div>
  </div>
</template>

<script>
const DEFAULT_PARTICLE_CONFIG = {
  count: 80,
  color: '#ffffff',
  speed: 1.5,
  radius: 3,
  maxRadius: 6,
  connectDistance: 150,
  shape: 'circle',
}

export default {
  name: 'ParticleBg',

  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      particles: [],
      animationId: null,
      canvasCtx: null,
      width: 0,
      height: 0,
    }
  },

  computed: {
    type() {
      return this.config?.type || 'image'
    },
    imageUrl() {
      return this.config?.image_url || ''
    },
    videoUrl() {
      return this.config?.video_url || ''
    },
    gradientColors() {
      return this.config?.gradient_colors || []
    },
    gradientStyle() {
      const colors = this.gradientColors
      if (colors.length >= 2) {
        return `linear-gradient(135deg, ${colors.join(', ')})`
      }
      return colors[0] || '#1a1a2e'
    },
    overlayOpacity() {
      return this.config?.overlay_opacity ?? 0.4
    },
    particleConfig() {
      if (this.type !== 'particles') return DEFAULT_PARTICLE_CONFIG
      return { ...DEFAULT_PARTICLE_CONFIG, ...(this.config?.particle_config || {}) }
    },
  },

  watch: {
    type: {
      immediate: true,
      handler(val) {
        if (val === 'particles') {
          this.$nextTick(() => this.initParticles())
        } else {
          this.destroyParticles()
        }
      },
    },
    'config.particle_config': {
      deep: true,
      handler() {
        if (this.type === 'particles') {
          this.initParticles()
        }
      },
    },
  },

  mounted() {
    window.addEventListener('resize', this.handleResize)
    if (this.type === 'particles') {
      this.$nextTick(() => this.initParticles())
    }
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.destroyParticles()
  },

  methods: {
    handleResize() {
      if (this.type === 'particles') {
        this.initParticles()
      }
    },

    initParticles() {
      this.destroyParticles()

      const canvas = this.$refs.canvas
      if (!canvas) return

      this.canvasCtx = canvas.getContext('2d')
      this.width = canvas.width = window.innerWidth
      this.height = canvas.height = window.innerHeight

      const cfg = this.particleConfig
      this.particles = []

      for (let i = 0; i < cfg.count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * cfg.speed,
          vy: (Math.random() - 0.5) * cfg.speed,
          radius: Math.random() * (cfg.maxRadius - cfg.radius) + cfg.radius,
        })
      }

      this.animate(cfg)
    },

    animate(cfg) {
      const ctx = this.canvasCtx
      if (!ctx) return

      ctx.clearRect(0, 0, this.width, this.height)

      // 绘制连线
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x
          const dy = this.particles[i].y - this.particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < cfg.connectDistance) {
            const opacity = 1 - dist / cfg.connectDistance
            ctx.strokeStyle = cfg.color.replace(')', `, ${opacity * 0.5})`).replace('rgb', 'rgba')
            if (cfg.color.startsWith('#')) {
              ctx.strokeStyle = cfg.color
              ctx.globalAlpha = opacity * 0.3
            }
            ctx.beginPath()
            ctx.moveTo(this.particles[i].x, this.particles[i].y)
            ctx.lineTo(this.particles[j].x, this.particles[j].y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      // 绘制粒子
      for (const p of this.particles) {
        ctx.fillStyle = cfg.color
        ctx.beginPath()
        if (cfg.shape === 'circle') {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        } else {
          // 方形粒子
          ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)
        }
        ctx.fill()

        // 更新位置
        p.x += p.vx
        p.y += p.vy

        // 边界检测
        if (p.x < 0 || p.x > this.width) p.vx *= -1
        if (p.y < 0 || p.y > this.height) p.vy *= -1
      }

      this.animationId = requestAnimationFrame(() => this.animate(cfg))
    },

    destroyParticles() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
      this.particles = []
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
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
