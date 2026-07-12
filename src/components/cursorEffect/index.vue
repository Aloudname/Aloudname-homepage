<!--
  自定义鼠标指针特效组件
  支持类型: custom_image（自定义图片）| trail（拖尾）| glow（发光）
  配置从 page_config 的 cursor section 读取
-->
<template>
  <div class="cursor-effect-container">
    <!-- 拖尾粒子容器 -->
    <canvas
      ref="trailCanvas"
      v-if="style === 'trail'"
      class="cursor-trail-canvas"
    ></canvas>

    <!-- 发光圆跟随 -->
    <div
      ref="glowEl"
      v-if="style === 'glow'"
      class="cursor-glow"
      :style="glowStyle"
    ></div>

    <!-- 自定义光标图片（通过 CSS cursor 属性实现） -->
  </div>
</template>

<script>
const DEFAULT_TRAIL_CONFIG = {
  length: 10,
  color: '#ff6b9d',
  size: 8,
  fadeSpeed: 0.05,
}

const DEFAULT_GLOW_CONFIG = {
  radius: 40,
  color: 'rgba(100, 200, 255, 0.5)',
  blur: 20,
}

export default {
  name: 'CursorEffect',

  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      mouseX: -100,
      mouseY: -100,
      trailPoints: [],
      animationId: null,
      canvasCtx: null,
    }
  },

  computed: {
    style() {
      return this.config?.style || 'default'
    },
    trailConfig() {
      return { ...DEFAULT_TRAIL_CONFIG, ...(this.config?.trail_config || {}) }
    },
    glowConfig() {
      return { ...DEFAULT_GLOW_CONFIG, ...(this.config?.glow_config || {}) }
    },
    glowStyle() {
      const gc = this.glowConfig
      return {
        width: `${gc.radius * 2}px`,
        height: `${gc.radius * 2}px`,
        background: `radial-gradient(circle, ${gc.color} 0%, transparent 70%)`,
        filter: `blur(${gc.blur}px)`,
        transform: `translate(${this.mouseX - gc.radius}px, ${this.mouseY - gc.radius}px)`,
      }
    },
    customCursorImage() {
      return this.config?.image_url || ''
    },
  },

  watch: {
    style: {
      immediate: true,
      handler(val) {
        this.cleanup()
        if (val === 'trail') {
          this.$nextTick(() => this.initTrail())
        } else if (val === 'glow') {
          this.initGlow()
        } else if (val === 'custom_image' && this.customCursorImage) {
          this.applyCustomCursor()
        } else {
          this.removeCustomCursor()
        }
      },
    },
    customCursorImage(url) {
      if (this.style === 'custom_image' && url) {
        this.applyCustomCursor()
      }
    },
  },

  mounted() {
    document.addEventListener('mousemove', this.onMouseMove)
    if (this.style === 'trail') {
      this.$nextTick(() => this.initTrail())
    } else if (this.style === 'custom_image' && this.customCursorImage) {
      this.applyCustomCursor()
    }
  },

  beforeDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove)
    this.cleanup()
  },

  methods: {
    onMouseMove(e) {
      this.mouseX = e.clientX
      this.mouseY = e.clientY

      if (this.style === 'trail') {
        this.trailPoints.push({
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
        })
        if (this.trailPoints.length > this.trailConfig.length * 3) {
          this.trailPoints.shift()
        }
      }
    },

    // ===== 拖尾特效 =====
    initTrail() {
      const canvas = this.$refs.trailCanvas
      if (!canvas) return

      this.canvasCtx = canvas.getContext('2d')
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      this.trailPoints = []
      this.renderTrail()
    },

    renderTrail() {
      const canvas = this.$refs.trailCanvas
      const ctx = this.canvasCtx
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cfg = this.trailConfig
      const points = this.trailPoints
      const count = Math.min(points.length, cfg.length)

      for (let i = 0; i < count; i++) {
        const p = points[points.length - 1 - i]
        const opacity = 1 - i / cfg.length
        const size = cfg.size * (1 - i / cfg.length * 0.7)

        ctx.fillStyle = cfg.color.replace(')', `, ${opacity})`)
          .replace('rgb', 'rgba')
        if (cfg.color.startsWith('#')) {
          ctx.fillStyle = cfg.color
          ctx.globalAlpha = opacity
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(size, 1), 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // 衰减旧点
      for (const p of this.trailPoints) {
        p.opacity -= cfg.fadeSpeed
      }
      this.trailPoints = this.trailPoints.filter(p => p.opacity > 0)

      this.animationId = requestAnimationFrame(() => this.renderTrail())
    },

    // ===== 自定义光标 =====
    applyCustomCursor() {
      const styleEl = document.getElementById('custom-cursor-style')
      if (styleEl) {
        styleEl.textContent = `
          * { cursor: url(${this.customCursorImage}) 16 16, auto !important; }
          a, button, .el-button, [role="button"], input[type="submit"] {
            cursor: url(${this.customCursorImage}) 16 16, pointer !important;
          }
        `
      } else {
        const el = document.createElement('style')
        el.id = 'custom-cursor-style'
        el.textContent = `
          * { cursor: url(${this.customCursorImage}) 16 16, auto !important; }
          a, button, .el-button, [role="button"], input[type="submit"] {
            cursor: url(${this.customCursorImage}) 16 16, pointer !important;
          }
        `
        document.head.appendChild(el)
      }
    },

    removeCustomCursor() {
      const styleEl = document.getElementById('custom-cursor-style')
      if (styleEl) styleEl.remove()
    },

    // ===== 发光 =====
    initGlow() {
      // glow 通过 computed glowStyle 响应式更新，无需额外初始化
    },

    cleanup() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
      this.trailPoints = []
      this.removeCustomCursor()
    },
  },
}
</script>

<style lang="scss">
.cursor-effect-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;
}

.cursor-trail-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cursor-glow {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.08s ease-out;
}
</style>
