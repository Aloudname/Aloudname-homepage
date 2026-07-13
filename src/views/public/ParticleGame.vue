<template>
  <div class="game-panel" ref="panel">
    <div class="game-bg" :style="{ backgroundImage: bgImage ? `url(${bgImage})` : '' }"></div>
    <div class="game-gradient" :style="gradientStyle"></div>
    <canvas ref="canvas" class="game-canvas"></canvas>

    <!-- 目标容器 -->
    <div class="game-target" ref="targetEl" :style="targetStyle">
      <span class="target-inner">⊙</span>
    </div>

    <!-- UI -->
    <div class="game-ui">
      <div class="game-score" ref="scoreEl">{{ score }}</div>
      <div class="game-hint">🎯 移动鼠标→粒子引力→投入容器</div>
      <button class="game-close" @click="$emit('close')">✕ 关闭</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParticleGame',

  props: {
    bgImage: { type: String, default: '' },
    gradient: { type: Array, default: () => ['#1a1a2e', '#0f3460'] },
    particleColor: { type: String, default: '#00ff88' },
    particleSize: { type: Number, default: 5 },
    cursorMass: { type: Number, default: 80 },
    particleMass: { type: Number, default: 1 },
    gravityRange: { type: Number, default: 250 },
    gravityStrength: { type: Number, default: 0.6 },
  },

  emits: ['close'],

  data() {
    return {
      score: 0,
      particles: [],
      targetX: 0, targetY: 0, targetVX: 0, targetVY: 0,
      targetR: 45,
      mouse: { x: -999, y: -999, active: false },
      animId: null,
      ctx: null,
      width: 0, height: 0,
      elapsed: 0, lastTime: 0,
      spawnAccum: 0,
      scorePopups: [],
    }
  },

  computed: {
    gradientStyle() {
      const c = this.gradient.filter(Boolean)
      if (c.length >= 2) return { background: `linear-gradient(135deg, ${c.join(',')})`, opacity: 0.6 }
      return {}
    },
    targetStyle() {
      return {
        left: `${this.targetX}px`,
        top: `${this.targetY}px`,
        width: `${this.targetR * 2}px`,
        height: `${this.targetR * 2}px`,
      }
    },
    // 对数增长 + 上限
    avgSpeed() {
      return Math.min(2 + Math.log(1 + this.score) * 1.5, 12)
    },
    spawnRate() {
      return Math.min(1 + Math.log(1 + this.score) * 0.7, 6)
    },
    containerSpeed() {
      return Math.min(0.8 + Math.log(1 + this.score) * 0.6, 5)
    },
  },

  mounted() {
    this.initCanvas()
    this.lastTime = performance.now()
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseleave', this.onMouseLeave)
    this.loop(performance.now())
  },

  beforeDestroy() {
    cancelAnimationFrame(this.animId)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseleave', this.onMouseLeave)
  },

  methods: {
    initCanvas() {
      const c = this.$refs.canvas
      this.ctx = c.getContext('2d')
      this.width = c.width = window.innerWidth
      this.height = c.height = window.innerHeight
      this.targetX = this.width / 2
      this.targetY = this.height / 2
    },

    onMouseMove(e) {
      this.mouse.x = e.clientX
      this.mouse.y = e.clientY
      this.mouse.active = true
    },
    onMouseLeave() { this.mouse.active = false },

    // ====== 正态分布随机数 (Box-Muller) ======
    normalRandom(mean, stddev) {
      let u = 0, v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return mean + stddev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },

    // ====== 主循环 ======
    loop(ts) {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.1)
      this.lastTime = ts
      this.elapsed += dt

      const ctx = this.ctx
      ctx.clearRect(0, 0, this.width, this.height)

      // 生成粒子 — 对数速率，最多 32 个
      const MAX_PARTICLES = 32
      this.spawnAccum += dt
      const interval = 1 / this.spawnRate
      while (this.spawnAccum > interval && this.particles.length < MAX_PARTICLES) {
        this.particles.push(this.spawn())
        this.spawnAccum -= interval
      }

      // 容器随机游走 — 速率对数增长
      const cSpeed = this.containerSpeed
      // Perlin-like smooth random: use sin of large prime multiples of elapsed
      this.targetVX = Math.sin(this.elapsed * 1.31 + 0.7) * Math.cos(this.elapsed * 0.73) * cSpeed * 80
      this.targetVY = Math.cos(this.elapsed * 1.17 + 1.2) * Math.sin(this.elapsed * 0.89) * cSpeed * 80
      this.targetX += this.targetVX * dt
      this.targetY += this.targetVY * dt
      // 容器边界约束
      const margin = this.targetR + 20
      this.targetX = Math.max(margin, Math.min(this.width - margin, this.targetX))
      this.targetY = Math.max(margin, Math.min(this.height - margin, this.targetY))

      // 粒子物理
      const mouse = this.mouse
      const gRange = this.gravityRange
      const gStr = this.gravityStrength
      const cMass = this.cursorMass
      const pMass = this.particleMass

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]

        // 鼠标引力
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < gRange && dist > 1) {
            const force = (gStr * cMass * pMass) / (dist * dist)
            p.vx += (dx / dist) * force / pMass
            p.vy += (dy / dist) * force / pMass
          }
        }

        // ★ 无阻尼

        p.x += p.vx
        p.y += p.vy

        // ★ 弹性碰撞边界
        if (p.x <= this.particleSize)        { p.x = this.particleSize;        p.vx = Math.abs(p.vx) }
        if (p.x >= this.width - this.particleSize)  { p.x = this.width - this.particleSize;  p.vx = -Math.abs(p.vx) }
        if (p.y <= this.particleSize)        { p.y = this.particleSize;        p.vy = Math.abs(p.vy) }
        if (p.y >= this.height - this.particleSize) { p.y = this.height - this.particleSize; p.vy = -Math.abs(p.vy) }

        // 容器捕获检测
        const dx = this.targetX - p.x, dy = this.targetY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < this.targetR + this.particleSize) {
          this.capture(i, p)
          continue
        }

        // 绘制
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const alpha = Math.min(1, 0.3 + speed / 6)
        ctx.fillStyle = this.particleColor
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, this.particleSize, 0, Math.PI * 2)
        ctx.fill()

        // 拖尾
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 8) p.trail.shift()
        for (let t = 0; t < p.trail.length; t++) {
          ctx.fillStyle = this.particleColor
          ctx.globalAlpha = (t / p.trail.length) * 0.25
          ctx.beginPath()
          ctx.arc(p.trail[t].x, p.trail[t].y, this.particleSize * (0.5 + t / p.trail.length * 0.5), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // 分数弹出动画更新
      for (let i = this.scorePopups.length - 1; i >= 0; i--) {
        const pop = this.scorePopups[i]
        pop.y -= 1.5
        pop.life -= dt
        if (pop.life <= 0) { this.scorePopups.splice(i, 1); continue }
        ctx.fillStyle = '#fff'
        ctx.globalAlpha = pop.life / 1.2
        ctx.font = 'bold 18px monospace'
        ctx.fillText('+1', pop.x, pop.y)
      }
      ctx.globalAlpha = 1

      this.animId = requestAnimationFrame(t => this.loop(t))
    },

    spawn() {
      const edge = Math.floor(Math.random() * 4)
      // 正态分布速率：均值 = avgSpeed，标准差 = avgSpeed * 0.25
      const avg = this.avgSpeed
      const speed = Math.max(0.5, this.normalRandom(avg, avg * 0.25))
      let x, y, vx, vy
      // 从边缘随机位置生成，方向指向内部
      const angle = Math.random() * Math.PI * 2
      switch (edge) {
        case 0: x = Math.random() * this.width; y = this.particleSize; vx = Math.cos(angle) * speed; vy = Math.abs(Math.sin(angle)) * speed; break
        case 1: x = this.width - this.particleSize; y = Math.random() * this.height; vx = -Math.abs(Math.cos(angle)) * speed; vy = Math.sin(angle) * speed; break
        case 2: x = Math.random() * this.width; y = this.height - this.particleSize; vx = Math.cos(angle) * speed; vy = -Math.abs(Math.sin(angle)) * speed; break
        default: x = this.particleSize; y = Math.random() * this.height; vx = Math.abs(Math.cos(angle)) * speed; vy = Math.sin(angle) * speed
      }
      return { x, y, vx, vy, trail: [] }
    },

    capture(i, p) {
      // 爆发特效
      for (let b = 0; b < 6; b++) {
        const angle = (Math.PI * 2 * b) / 6
        this.particles.push({
          x: p.x, y: p.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          trail: [],
        })
      }
      this.particles.splice(i, 1)
      this.score++
      this.scorePopups.push({ x: p.x, y: p.y, life: 1.2 })
    },
  },
}
</script>

<style lang="scss" scoped>
.game-panel {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 10;
  overflow: hidden;
  background: #0a0a1a;
}
.game-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover; background-position: center;
  opacity: 0.35;
}
.game-gradient {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
}
.game-canvas {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1;
}

// 目标容器
.game-target {
  position: absolute;
  z-index: 2;
  border: 2px dashed rgba(255,255,255,0.4);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transform: translate(-50%, -50%);
  animation: targetGlow 2s ease-in-out infinite;
  pointer-events: none;
}
.target-inner {
  font-size: 24px;
  opacity: 0.5;
  animation: targetSpin 4s linear infinite;
}
@keyframes targetGlow {
  0%,100% { box-shadow: 0 0 20px rgba(0,255,136,0.15); border-color: rgba(255,255,255,0.3); }
  50%     { box-shadow: 0 0 40px rgba(0,255,136,0.3);  border-color: rgba(255,255,255,0.55); }
}
@keyframes targetSpin {
  to { transform: rotate(360deg); }
}

// UI
.game-ui {
  position: absolute; top: 0; left: 0; width: 100%;
  z-index: 5;
  pointer-events: none;
}
.game-score {
  position: absolute; top: 24px; right: 32px;
  font-size: 64px; font-weight: 900;
  color: #fff; text-shadow: 0 0 20px rgba(0,255,136,0.5);
  pointer-events: none;
}
.game-hint {
  position: absolute; top: 24px; left: 50%; transform: translateX(-50%);
  font-size: 14px; color: rgba(255,255,255,0.45);
  pointer-events: none;
}
.game-close {
  position: absolute; top: 20px; left: 24px;
  background: rgba(255,255,255,0.08); color: #fff;
  border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
  padding: 8px 16px; font-size: 14px; cursor: pointer;
  pointer-events: auto;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.15); }
}
</style>
