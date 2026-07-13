<template>
  <div class="game-panel" ref="panel">
    <div class="game-bg" :style="{ backgroundImage: bgImage ? `url(${bgImage})` : '' }"></div>
    <div class="game-gradient" :style="gradientStyle"></div>
    <canvas ref="canvas" class="game-canvas"></canvas>

    <!-- UI -->
    <div class="game-ui">
      <div class="game-score" ref="scoreEl">{{ score }}</div>
      <div class="game-combo" v-if="combo >= 3"> x{{ combo }} COMBO!</div>
      <div class="game-hint">这是什么？</div>
    </div>

    <!-- 稳定性条 -->
    <div class="stability-bar">
      <div class="stability-fill" :style="{ width: stability + '%', background: stabColor }"></div>
      <span class="stability-label">{{ stability > 0 ? '稳定性' : '游戏结束，3秒后重置' }}</span>
    </div>

    <!-- 底部返回 -->
    <div class="game-back" @click="$emit('close')">
      <span class="back-arrow">⌄</span>
      <span class="back-text">back!/span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GravityShepherd',

  props: {
    bgImage: { type: String, default: '' },
    gradient: { type: Array, default: () => ['#1a1a2e', '#0f3460'] },
    particleColor: { type: String, default: '#00ff88' },
    cursorMass: { type: Number, default: 80 },
    particleMass: { type: Number, default: 1 },
    gravityRange: { type: Number, default: 250 },
    gravityStrength: { type: Number, default: 0.6 },
  },

  emits: ['close'],

  data() {
    return {
      score: 0, stability: 100, combo: 0, comboTimer: 0,
      particles: [],
      ring: { x: 0, y: 0, phase: 0, r: 32 },
      mouse: { x: -999, y: -999, active: false },
      animId: null, ctx: null, width: 0, height: 0,
      elapsed: 0, lastTime: 0, spawnAccum: 0,
      scorePopups: [], gameOver: false, resetTimer: 0,
    }
  },

  computed: {
    gradientStyle() {
      const c = this.gradient.filter(Boolean)
      return c.length >= 2 ? { background: `linear-gradient(135deg, ${c.join(',')})`, opacity: 0.55 } : {}
    },
    avgSpeed()   { return Math.min(2.5 + Math.log(1 + this.score) * 1.2, 10) },
    spawnRate()  { return Math.min(1.5 + Math.log(1 + this.score) * 0.5, 5) },
    ringAmp()    { return Math.min(0.25 + Math.log(1 + this.score) * 0.035, 0.42) },
    ringSpeed()  { return Math.min(0.7 + Math.log(1 + this.score) * 0.35, 2.8) },
    stabColor() {
      if (this.stability > 60) return '#42b983'
      if (this.stability > 30) return '#e6a23c'
      return '#f56c6c'
    },
  },

  mounted() {
    this.initCanvas()
    this.lastTime = performance.now()
    document.addEventListener('mousemove', this.onMouse)
    document.addEventListener('mouseleave', this.onMouseLeave)
    document.addEventListener('wheel', this.onWheel)
    this.loop(performance.now())
  },

  beforeDestroy() {
    cancelAnimationFrame(this.animId)
    document.removeEventListener('mousemove', this.onMouse)
    document.removeEventListener('mouseleave', this.onMouseLeave)
    document.removeEventListener('wheel', this.onWheel)
  },

  methods: {
    initCanvas() {
      const c = this.$refs.canvas
      this.ctx = c.getContext('2d')
      this.width = c.width = window.innerWidth
      this.height = c.height = window.innerHeight
      this.ring.x = this.width / 2
      this.ring.y = this.height / 2
    },

    onMouse(e) { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.active = true },
    onMouseLeave() { this.mouse.active = false },
    onWheel(e) { if (e.deltaY > 0) this.$emit('close') },

    // ====== Box-Muller 正态分布 ======
    normal(mean, std) {
      let u = 0; while (u === 0) u = Math.random()
      let v = 0; while (v === 0) v = Math.random()
      return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },

    // ====== 主循环 ======
    loop(ts) {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.1)
      this.lastTime = ts
      this.elapsed += dt

      const ctx = this.ctx
      ctx.clearRect(0, 0, this.width, this.height)

      // 游戏结束倒计时
      if (this.gameOver) {
        this.resetTimer -= dt
        if (this.resetTimer <= 0) this.resetGame()
        this.drawGameOver(ctx)
        this.animId = requestAnimationFrame(t => this.loop(t))
        return
      }

      const MAX = 24

      // 生成粒子
      this.spawnAccum += dt
      const interval = 1 / this.spawnRate
      while (this.spawnAccum > interval && this.particles.length < MAX) {
        this.particles.push(this.spawn())
        this.spawnAccum -= interval
      }

      // Lissajous 环
      this.ring.phase += this.ringSpeed * dt
      const ph = this.ring.phase
      const amp = this.ringAmp
      this.ring.x = this.width / 2  + Math.sin(3 * ph + 0.7) * amp * this.width
      this.ring.y = this.height / 2 + Math.cos(2 * ph)       * amp * this.height

      // 绘制环
      this.drawRing(ctx)

      // 粒子物理
      const mouse = this.mouse
      const gRange = this.gravityRange
      const gStr = this.gravityStrength
      const pSize = 5

      let capturedThisFrame = false

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]

        // 鼠标引力
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < gRange && dist > 1) {
            const F = (gStr * this.cursorMass * this.particleMass) / (dist * dist)
            p.vx += (dx / dist) * F / this.particleMass
            p.vy += (dy / dist) * F / this.particleMass
          }
        }

        // 无阻尼 + 弹性边界
        p.x += p.vx
        p.y += p.vy
        if (p.x <= pSize)        { p.x = pSize;        p.vx = Math.abs(p.vx) }
        if (p.x >= this.width - pSize)  { p.x = this.width - pSize;  p.vx = -Math.abs(p.vx) }
        if (p.y <= pSize)        { p.y = pSize;        p.vy = Math.abs(p.vy) }
        if (p.y >= this.height - pSize) { p.y = this.height - pSize; p.vy = -Math.abs(p.vy) }

        // 环捕获检测
        const rdx = this.ring.x - p.x, rdy = this.ring.y - p.y
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy)
        if (rdist < this.ring.r + pSize) {
          this.onCapture(i, p)
          capturedThisFrame = true
          continue
        }

        // 逃逸检测（飞出屏幕）
        if (p.x <= 0 || p.x >= this.width || p.y <= 0 || p.y >= this.height) {
          this.particles.splice(i, 1)
          this.stability = Math.max(0, this.stability - 4)
          if (this.stability <= 0) this.triggerGameOver()
          continue
        }

        // 绘制粒子
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const alpha = Math.min(1, 0.25 + speed / this.avgSpeed * 0.5)
        ctx.fillStyle = this.particleColor
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2)
        ctx.fill()

        // 拖尾（3帧）
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 3) p.trail.shift()
        for (let t = 0; t < p.trail.length; t++) {
          ctx.fillStyle = this.particleColor
          ctx.globalAlpha = (t / p.trail.length) * 0.2
          ctx.beginPath()
          ctx.arc(p.trail[t].x, p.trail[t].y, pSize * (0.4 + t / p.trail.length * 0.6), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Combo 计时
      if (capturedThisFrame) {
        this.combo++
        this.comboTimer = 1.5
      } else {
        this.comboTimer -= dt
        if (this.comboTimer <= 0) this.combo = 0
      }

      // 分数弹出
      for (let i = this.scorePopups.length - 1; i >= 0; i--) {
        const pop = this.scorePopups[i]
        pop.y -= 1.2; pop.life -= dt
        if (pop.life <= 0) { this.scorePopups.splice(i, 1); continue }
        ctx.fillStyle = '#fff'
        ctx.globalAlpha = pop.life / 1
        ctx.font = 'bold 16px monospace'
        ctx.fillText('+1', pop.x, pop.y)
      }

      ctx.globalAlpha = 1
      this.animId = requestAnimationFrame(t => this.loop(t))
    },

    // ====== 绘制环 ======
    drawRing(ctx) {
      const { x, y, r } = this.ring
      // 外发光
      const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.8)
      glow.addColorStop(0, 'rgba(100,200,255,0.3)')
      glow.addColorStop(0.5, 'rgba(100,200,255,0.1)')
      glow.addColorStop(1, 'rgba(100,200,255,0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill()

      // 虚线环
      const pulse = 1 + Math.sin(this.elapsed * 3) * 0.06
      ctx.strokeStyle = 'rgba(200,230,255,0.7)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.arc(x, y, r * pulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    },

    // ====== 捕获 ======
    onCapture(i, p) {
      // 爆发特效
      for (let b = 0; b < 8; b++) {
        const a = (Math.PI * 2 * b) / 8
        this.particles.push({
          x: p.x, y: p.y,
          vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
          trail: [],
        })
      }
      this.particles.splice(i, 1)
      this.score++
      this.stability = Math.min(100, this.stability + 1)
      this.scorePopups.push({ x: p.x, y: p.y, life: 0.8 })
    },

    // ====== 生成 ======
    spawn() {
      const edge = Math.floor(Math.random() * 4)
      const s = Math.max(0.5, this.normal(this.avgSpeed, this.avgSpeed * 0.3))
      const a = Math.random() * Math.PI * 2
      let x, y, vx, vy
      switch (edge) {
        case 0: x = Math.random() * this.width; y = 5;  vx = Math.cos(a)*s; vy = Math.abs(Math.sin(a))*s; break
        case 1: x = this.width-5; y = Math.random()*this.height; vx = -Math.abs(Math.cos(a))*s; vy = Math.sin(a)*s; break
        case 2: x = Math.random()*this.width; y = this.height-5; vx = Math.cos(a)*s; vy = -Math.abs(Math.sin(a))*s; break
        default: x = 5; y = Math.random()*this.height; vx = Math.abs(Math.cos(a))*s; vy = Math.sin(a)*s
      }
      return { x, y, vx, vy, trail: [] }
    },

    // ====== 游戏结束 ======
    triggerGameOver() {
      this.gameOver = true
      this.resetTimer = 3
    },
    resetGame() {
      this.score = 0; this.stability = 100; this.combo = 0
      this.particles = []; this.spawnAccum = 0
      this.gameOver = false; this.resetTimer = 0
    },
    drawGameOver(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, this.width, this.height)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 36px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('游戏结束', this.width/2, this.height/2 - 10)
      ctx.font = '18px monospace'
      ctx.fillText(`最终得分: ${this.score}  ·  ${Math.ceil(this.resetTimer)}秒后重置`, this.width/2, this.height/2 + 30)
      ctx.textAlign = 'start'
    },
  },
}
</script>

<style lang="scss" scoped>
.game-panel {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  z-index: 10; overflow: hidden; background: #0a0a1a;
}
.game-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover; background-position: center; opacity: 0.3;
}
.game-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.game-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }

.game-ui { position: absolute; top: 0; left: 0; width: 100%; z-index: 5; pointer-events: none; }
.game-score {
  position: absolute; top: 20px; right: 28px;
  font-size: 56px; font-weight: 900; color: #fff;
  text-shadow: 0 0 20px rgba(0,200,255,0.4);
}
.game-combo {
  position: absolute; top: 84px; right: 28px;
  font-size: 22px; font-weight: 700; color: #ffa500;
  text-shadow: 0 0 12px rgba(255,165,0,0.5);
  animation: comboPop 0.3s ease;
}
@keyframes comboPop { 0% { transform: scale(1.3); } 100% { transform: scale(1); } }
.game-hint {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  font-size: 13px; color: rgba(255,255,255,0.35);
}

// 稳定性条
.stability-bar {
  position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
  width: 260px; height: 6px; background: rgba(255,255,255,0.1);
  border-radius: 3px; overflow: hidden; z-index: 5;
}
.stability-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.3s, background 0.3s;
}
.stability-label {
  display: block; text-align: center; font-size: 11px;
  color: rgba(255,255,255,0.3); margin-top: 4px;
}

// 底部返回
.game-back {
  position: absolute; bottom: 0; left: 0; width: 100%; z-index: 5;
  text-align: center; padding: 8px 0 24px; cursor: pointer; pointer-events: auto;
  &:hover { opacity: 0.5; }
  .back-arrow {
    display: block; font-size: 32px; color: rgba(255,255,255,0.3);
    animation: bounceDown 1.8s ease-in-out infinite; line-height: 1;
  }
  .back-text { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 2px; }
}
@keyframes bounceDown {
  0%,100% { transform: translateY(0); opacity: 0.25; }
  50%     { transform: translateY(5px); opacity: 0.6; }
}
</style>
