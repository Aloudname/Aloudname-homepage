<template>
  <div class="game-panel">
    <div class="game-bg" :style="{ backgroundImage: bgImage ? `url(${bgImage})` : '' }"></div>
    <div class="game-gradient" :style="gradientStyle"></div>
    <canvas ref="canvas" class="game-canvas"></canvas>

    <!-- 容器：被鼠标引力牵引的猫 -->
    <img
      ref="cat"
      :src="catSrc"
      class="game-cat"
      :style="{ left: ring.x + 'px', top: ring.y + 'px', transform: 'translate(-50%,-50%) rotate(' + ring.angle + 'rad)' }"
    />

    <div class="game-ui">
      <div class="game-score">{{ score }}</div>
      <div class="game-combo" v-if="combo >= 3">🔥 x{{ combo }}</div>
      <div class="game-hint">🧲 鼠标引力 → 喂给小猫</div>
    </div>

    <div class="stability-bar">
      <div class="stability-fill" :style="{ width: stability + '%', background: stabColor }"></div>
      <span class="stability-label">{{ stability > 0 ? '稳定性' : '游戏结束 · 3秒后重置' }}</span>
    </div>

    <div class="game-back" @click="$emit('close')">
      <span class="back-arrow">⌄</span>
      <span class="back-text">向下滚动或点击返回</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GravityShepherd',

  props: {
    bgImage:        { type: String, default: '' },
    gradient:       { type: Array,  default: () => ['#1a1a2e', '#0f3460'] },
    particleColor:  { type: String, default: '#00ff88' },
    cursorMass:     { type: Number, default: 80 },
    particleMass:   { type: Number, default: 1 },
    gravityRange:   { type: Number, default: 250 },
    gravityStrength:{ type: Number, default: 0.6 },
  },

  emits: ['close'],

  data() {
    return {
      score: 0, stability: 100, combo: 0, comboTimer: 0,
      particles: [],
      catSrc: require('@/assets/capooeat.gif'),
      // 容器（猫）：位置 + 速度（惯性）+ 旋转角度
      ring: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, targetAngle: 0, r: 40 },
      mouse: { x: -999, y: -999, active: false },
      animId: null, ctx: null, W: 0, H: 0,
      elapsed: 0, lastT: 0, spawnAcc: 0,
      gameOver: false, resetT: 0,
    }
  },

  computed: {
    gradientStyle() {
      const c = this.gradient.filter(Boolean)
      return c.length >= 2 ? { background: `linear-gradient(135deg, ${c.join(',')})`, opacity: 0.55 } : {}
    },
    avgSpd()  { return Math.min(2.5 + Math.log(1 + this.score) * 0.8, 8) },
    spnRate() { return Math.min(1.5 + Math.log(1 + this.score) * 0.5, 5) },
    catMass() { return 8 },  // 容器质量大 → 惯性大，不容易被鼠标甩飞
    stabColor() {
      if (this.stability > 60) return '#42b983'
      if (this.stability > 30) return '#e6a23c'
      return '#f56c6c'
    },
  },

  mounted() {
    const c = this.$refs.canvas
    if (!c) return
    this.ctx = c.getContext('2d')
    this.W = c.width  = window.innerWidth
    this.H = c.height = window.innerHeight
    this.ring.x = this.W / 2
    this.ring.y = this.H / 2
    this.lastT = performance.now()

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
    onMouse(e)      { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.active = true },
    onMouseLeave()  { this.mouse.active = false },
    onWheel(e)      { if (e.deltaY > 0) this.$emit('close') },

    // Box-Muller
    gauss(mean, sd) {
      let u = 0, v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },

    // ====== 主循环 ======
    loop(ts) {
      const dt = Math.min((ts - this.lastT) / 1000, 0.1)
      this.lastT = ts
      this.elapsed += dt
      const ctx = this.ctx
      if (!ctx) { this.animId = requestAnimationFrame(t => this.loop(t)); return }

      ctx.clearRect(0, 0, this.W, this.H)

      if (this.gameOver) {
        this.resetT -= dt
        if (this.resetT <= 0) this.doReset()
        this.drawOver(ctx)
        this.animId = requestAnimationFrame(t => this.loop(t))
        return
      }

      // ---- 生成粒子 ----
      const MAX = 32
      this.spawnAcc += dt
      const ival = 1 / this.spnRate
      while (this.spawnAcc > ival && this.particles.length < MAX) {
        this.particles.push(this.makeParticle())
        this.spawnAcc -= ival
      }

      // ---- 共享变量（容器和粒子都会用到） ----
      const m = this.mouse
      const gS = this.gravityStrength
      const gR = this.gravityRange
      const cM = this.cursorMass
      const pM = this.particleMass

      // ---- 容器（猫）物理：鼠标引力 + 惯性 + 边界约束 ----
      const catM = this.catMass
      if (m.active) {
        const dx = m.x - this.ring.x, dy = m.y - this.ring.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 1) {
          const F = (gS * catM * this.cursorMass) / Math.max(d, 20)
          this.ring.vx += (dx / d) * F / catM
          this.ring.vy += (dy / d) * F / catM
        }
        // 容器旋转目标：舌头（图像的左边）指向鼠标
        this.ring.targetAngle = Math.atan2(dy, dx) + Math.PI
      }
      // 容器惯性 + 阻尼
      this.ring.x += this.ring.vx * dt
      this.ring.y += this.ring.vy * dt
      this.ring.vx *= 0.96
      this.ring.vy *= 0.96
      // 边界约束
      const mrg = this.ring.r + 10
      if (this.ring.x < mrg)      { this.ring.x = mrg;      this.ring.vx =  Math.abs(this.ring.vx) * 0.5 }
      if (this.ring.x > this.W - mrg) { this.ring.x = this.W - mrg; this.ring.vx = -Math.abs(this.ring.vx) * 0.5 }
      if (this.ring.y < mrg)      { this.ring.y = mrg;      this.ring.vy =  Math.abs(this.ring.vy) * 0.5 }
      if (this.ring.y > this.H - mrg) { this.ring.y = this.H - mrg; this.ring.vy = -Math.abs(this.ring.vy) * 0.5 }
      // 旋转惯性平滑
      let aDiff = this.ring.targetAngle - this.ring.angle
      while (aDiff >  Math.PI) aDiff -= Math.PI * 2
      while (aDiff < -Math.PI) aDiff += Math.PI * 2
      this.ring.angle += aDiff * Math.min(dt * 8, 1)

      // ---- 粒子物理 ----
      const pSz = 5
      let capped = false

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]

        if (m.active) {
          const dx = m.x - p.x, dy = m.y - p.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < gR && d > 1) {
            const F = (gS * cM * pM) / (d * d)
            p.vx += (dx / d) * F / pM
            p.vy += (dy / d) * F / pM
          }
        }

        p.x += p.vx; p.y += p.vy
        if (p.x <= pSz)      { p.x = pSz;      p.vx =  Math.abs(p.vx) }
        if (p.x >= this.W - pSz) { p.x = this.W - pSz; p.vx = -Math.abs(p.vx) }
        if (p.y <= pSz)      { p.y = pSz;      p.vy =  Math.abs(p.vy) }
        if (p.y >= this.H - pSz) { p.y = this.H - pSz; p.vy = -Math.abs(p.vy) }

        // 捕获
        const rdx = this.ring.x - p.x, rdy = this.ring.y - p.y
        if (Math.sqrt(rdx * rdx + rdy * rdy) < this.ring.r + pSz) {
          this.doCapture(i, p); capped = true; continue
        }

        // 绘制
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        ctx.fillStyle = this.particleColor
        ctx.globalAlpha = Math.min(1, 0.25 + spd / this.avgSpd * 0.5)
        ctx.beginPath(); ctx.arc(p.x, p.y, pSz, 0, Math.PI * 2); ctx.fill()

        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 3) p.trail.shift()
        for (let t = 0; t < p.trail.length; t++) {
          ctx.fillStyle = this.particleColor
          ctx.globalAlpha = (t / p.trail.length) * 0.2
          ctx.beginPath()
          ctx.arc(p.trail[t].x, p.trail[t].y, pSz * (0.4 + t / p.trail.length * 0.6), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Combo
      if (capped) { this.combo++; this.comboTimer = 1.5 }
      else { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0 }

      ctx.globalAlpha = 1
      this.animId = requestAnimationFrame(t => this.loop(t))
    },

    // ====== 粒子生成 ======
    makeParticle() {
      const s = Math.max(0.5, this.gauss(this.avgSpd, this.avgSpd * 0.3))
      const a = Math.random() * Math.PI * 2
      const edge = Math.floor(Math.random() * 4)
      let x, y, vx, vy
      switch (edge) {
        case 0: x = Math.random() * this.W; y = 5;          vx = Math.cos(a) * s; vy =  Math.abs(Math.sin(a)) * s; break
        case 1: x = this.W - 5;             y = Math.random() * this.H; vx = -Math.abs(Math.cos(a)) * s; vy = Math.sin(a) * s; break
        case 2: x = Math.random() * this.W; y = this.H - 5; vx = Math.cos(a) * s; vy = -Math.abs(Math.sin(a)) * s; break
        default:x = 5;                      y = Math.random() * this.H; vx =  Math.abs(Math.cos(a)) * s; vy = Math.sin(a) * s
      }
      return { x, y, vx, vy, trail: [] }
    },

    // ====== 捕获 ======
    doCapture(i) {
      this.particles.splice(i, 1)
      this.score++
      this.stability = Math.min(100, this.stability + 2)
    },

    // ====== 结束/重置 ======
    triggerOver() { this.gameOver = true; this.resetT = 3 },
    doReset() {
      this.score = 0; this.stability = 100; this.combo = 0
      this.particles = []; this.spawnAcc = 0
      this.gameOver = false; this.resetT = 0
    },
    drawOver(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, this.W, this.H)
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
      ctx.font = 'bold 36px monospace'; ctx.fillText('游戏结束', this.W / 2, this.H / 2 - 10)
      ctx.font = '18px monospace'
      ctx.fillText('得分: ' + this.score + '  ·  ' + Math.ceil(this.resetT) + '秒后重置', this.W / 2, this.H / 2 + 30)
      ctx.textAlign = 'start'
    },
  },
}
</script>

<style lang="scss" scoped>
.game-panel  { position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10;overflow:hidden;background:#0a0a1a; }
.game-bg     { position:absolute;top:0;left:0;width:100%;height:100%;background-size:cover;background-position:center;opacity:0.3; }
.game-gradient{position:absolute;top:0;left:0;width:100%;height:100%;}
.game-canvas { position:absolute;top:0;left:0;width:100%;height:100%;z-index:1; }
.game-cat {
  position:absolute; z-index:2; width:70px; height:70px;
  pointer-events:none;
  transition: none;
}
.game-ui     { position:absolute;top:0;left:0;width:100%;z-index:5;pointer-events:none; }
.game-score  { position:absolute;top:20px;right:28px;font-size:56px;font-weight:900;color:#fff;text-shadow:0 0 20px rgba(0,200,255,0.4); }
.game-combo  { position:absolute;top:84px;right:28px;font-size:22px;font-weight:700;color:#ffa500;text-shadow:0 0 12px rgba(255,165,0,0.5); }
.game-hint   { position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:13px;color:rgba(255,255,255,0.35); }
.stability-bar    { position:absolute;bottom:60px;left:50%;transform:translateX(-50%);width:260px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;z-index:5; }
.stability-fill   { height:100%;border-radius:3px;transition:width .3s,background .3s; }
.stability-label  { display:block;text-align:center;font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px; }
.game-back   { position:absolute;bottom:0;left:0;width:100%;z-index:5;text-align:center;padding:8px 0 24px;cursor:pointer;pointer-events:auto;&:hover{opacity:0.5} }
.back-arrow  { display:block;font-size:32px;color:rgba(255,255,255,0.3);animation:bounceDown 1.8s ease-in-out infinite;line-height:1; }
.back-text   { font-size:11px;color:rgba(255,255,255,0.2);margin-top:2px; }
@keyframes bounceDown{0%,100%{transform:translateY(0);opacity:.25}50%{transform:translateY(5px);opacity:.6}}
</style>
