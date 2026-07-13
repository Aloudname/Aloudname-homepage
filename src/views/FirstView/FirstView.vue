<template>
  <div class="aboutBox" :style="pageBgStyle">
    <div class="trigger-indicator" :class="{ active: triggerProgress > 0 }">
      <div class="trigger-glow" :style="{ width: triggerProgress * 100 + '%', opacity: triggerProgress }"></div>
    </div>

    <bannerView :imgUrl="bannerImage" :titleName="title" height="45vh" ref="banner" />

    <!-- 调试标记：如果页面加载但看不到内容，至少能看到这条 -->
    <div v-if="!ghLoading && !ghUser && !markdownContent" style="color:#fff;text-align:center;padding:60px;">
      <h3>正在连接 GitHub...</h3>
    </div>

    <div class="mainBox">
      <div class="contentBox">
        <!-- 加载骨架（覆盖所有区块） -->
        <div v-if="ghLoading">
          <div class="skeleton-grid">
            <div class="skel-card" v-for="n in 4" :key="n"><div class="skel-bar w60"></div><div class="skel-bar w40 skel-bar-short"></div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
            <div class="skel-card"><div class="skel-bar w80"></div><div class="skel-bar w60 skel-bar-short"></div><div class="skel-bar w40 skel-bar-short"></div></div>
            <div class="skel-card"><div class="skel-bar w80"></div><div class="skel-bar w60 skel-bar-short"></div><div class="skel-bar w40 skel-bar-short"></div></div>
          </div>
          <div class="skel-card"><div class="skel-bar w80"></div><div class="skel-bar w60 skel-bar-short"></div><div class="skel-bar w40 skel-bar-short"></div></div>
        </div>

        <template v-else-if="ghUser">
          <!-- ====== 个人名片 ====== -->
          <div class="profile-card glass reveal-section">
            <div class="profile-avatar">
              <img :src="ghUser.avatar_url" class="profile-avatar-img" alt="avatar" loading="lazy"
                @error="$event.target.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text fill=%22%23666%22 x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2240%22>?</text></svg>'" />
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ ghUser.name || ghUser.login }}</h2>
              <p class="profile-bio">{{ ghUser.bio || 'A developer on GitHub' }}</p>
              <div class="profile-tags">
                <span v-if="ghUser.location" class="profile-tag">📍 {{ ghUser.location }}</span>
                <span v-if="ghUser.company" class="profile-tag">🏢 {{ ghUser.company }}</span>
                <span class="profile-tag">📅 Joined {{ formatJoinDate(ghUser.created_at) }}</span>
                <a :href="ghUser.blog" v-if="ghUser.blog" target="_blank" class="profile-tag link">🔗 {{ ghUser.blog.replace(/^https?:\/\//,'') }}</a>
              </div>
            </div>
            <div class="profile-follow">
              <div class="follow-item"><span class="follow-num">{{ ghUser.followers }}</span><span class="follow-lbl">followers</span></div>
              <div class="follow-item"><span class="follow-num">{{ ghUser.following }}</span><span class="follow-lbl">following</span></div>
            </div>
          </div>

          <!-- ====== 统计卡片 ====== -->
          <div class="stats-row" ref="statsRow">
            <div class="stat-card tilt-card" v-for="s in statCards" :key="s.label"
              @mousemove="onTilt($event)" @mouseleave="offTilt($event)">
              <div class="stat-icon">{{ s.icon }}</div>
              <div class="stat-num">{{ animated[s.label] || 0 }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>

          <!-- ====== 两栏: 技术栈 + 活动 ====== -->
          <div class="two-col">
            <!-- 技术栈 -->
            <div class="panel glass reveal-section">
              <div class="panel-head">🛠️ Tech Stack</div>
              <div class="lang-bars" v-if="languages.length">
                <div class="lang-bar" v-for="(l, i) in languages" :key="l.name"
                  :style="{ animationDelay: i * 0.08 + 's' }">
                  <div class="lang-info">
                    <span class="lang-name"><span class="lang-dot-sm" :style="{ background: l.color }"></span>{{ l.name }}</span>
                    <span class="lang-pct">{{ l.percent }}%</span>
                  </div>
                  <div class="lang-track">
                    <div class="lang-fill" :style="{ width: l.percent + '%', background: l.color, boxShadow: '0 0 8px ' + l.color }"></div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-note">暂无语言数据 ({{ ghRepos.length }} repos)</div>
            </div>

            <!-- 最近活动 -->
            <div class="panel glass reveal-section">
              <div class="panel-head">📡 Recent Activity</div>
              <div class="activity-list" v-if="activities.length">
                <div class="act-item" v-for="(a, i) in activities.slice(0, 8)" :key="i"
                  :style="{ animationDelay: i * 0.04 + 's' }">
                  <span class="act-dot" :class="{ pulse: i < 3 }"></span>
                  <span class="act-icon">{{ a.icon }}</span>
                  <span class="act-text"><span class="act-verb">{{ a.verb }}</span> <span class="act-repo">{{ a.repo }}</span></span>
                  <span class="act-time">{{ a.timeAgo }}</span>
                </div>
              </div>
              <div v-else class="empty-note">暂无动态 ({{ ghEvents.length }} events)</div>
            </div>
          </div>

          <!-- ====== 精选项目（3 张卡片 + 展开详情） ====== -->
          <div class="panel glass reveal-section">
            <div class="panel-head">📌 Featured Projects · 最近更新</div>
            <div class="featured-grid" v-if="featuredProjects.length">
              <div class="feat-card tilt-card" v-for="p in featuredProjects" :key="p.id"
                @click="openUrl(p.html_url)" @mousemove="onTilt($event)" @mouseleave="offTilt($event)">
                <div class="feat-top-bar" :style="{ background: langColor(p.language) }"></div>
                <div class="feat-body">
                  <h4 class="feat-name">{{ p.name }}</h4>
                  <p class="feat-desc">{{ p.description || 'No description' }}</p>
                  <div class="feat-meta">
                    <span v-if="p.language"><i class="lang-dot" :style="{ background: langColor(p.language) }"></i>{{ p.language }}</span>
                    <span>⭐ {{ p.stargazers_count }}</span>
                    <span>🍴 {{ p.forks_count }}</span>
                  </div>
                  <div class="feat-footer">
                    <span class="feat-updated">🕐 {{ formatDate(p.updated_at) }}</span>
                    <span v-if="p.topics && p.topics.length" class="feat-topics">
                      <span class="topic-tag" v-for="t in p.topics.slice(0,3)" :key="t">{{ t }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-note">暂无项目 ({{ ghRepos.filter(r=>!r.fork).length }} non-fork repos)</div>
          </div>
        </template>

        <div v-else-if="markdownContent" class="contentTitle reveal-section">
          <div class="markdown-body"><VueMarkdown :source="markdownContent" /></div>
        </div>
      </div>

      <!-- ====== 侧边栏 ====== -->
      <div v-if="sidebarVisible" :class="locked ? 'asideBoxFix' : 'asideBox'">
        <div class="asideImg">
          <el-avatar :src="sidebarAvatar || ghUser?.avatar_url" :size="sidebarAvatarSize" class="asidePic" />
        </div>
        <div class="asideTile">{{ sidebarName || ghUser?.login || '' }}</div>
        <div class="asideTile1">
          <span class="typing-bio">{{ displayedBio }}</span><span class="cursor-blink">|</span>
        </div>
        <el-divider>{{ sidebarDivider }}</el-divider>
        <div v-if="ghUser" class="aside-extra">
          <div v-if="ghUser.location" class="aside-row">📍 {{ ghUser.location }}</div>
          <div class="aside-row">📦 {{ ghUser.public_repos }} public repos</div>
          <div class="aside-row">⭐ {{ totalStars }} total stars</div>
        </div>
        <img v-if="sidebarBottomImg" :src="sidebarBottomImg" alt="" class="bottomImg" />
      </div>

      <div v-if="backtopVisible && btnFlag" class="go-top" @click="backTop">
        <img :src="backtopIcon || require('@/assets/backTop.png')" alt="" class="backTopbtn" />
      </div>
    </div>

    <footerView />

    <transition name="game-reveal">
      <GravityShepherd v-if="gameActive" :bgImage="gameBgImage" :gradient="gameGradient"
        :particleColor="gamePColor" @close="closeGame" />
    </transition>
  </div>
</template>

<script>
import bannerView from "@/components/bannerView/index"
import footerView from "@/components/footerView/index.vue"
import VueMarkdown from "vue-markdown"
import markdownRaw from "../home.md"
import { getSectionConfig } from '@/services/pageConfigService'
import { getUser, getReposCached, getEventsCached, calcLanguages, getTopProjects, calcTotalStars, parseEvents } from '@/services/githubService'
import "./css/FirstView.scss"
import "highlight.js/styles/github.css"
import "github-markdown-css"

const GravityShepherd = () => import('@/views/public/GravityShepherd.vue')
const TRIGGER_COUNT = 8
const DECAY_MS = 400

const LANG_COLORS = {
  JavaScript:'#f1e05a', TypeScript:'#3178c6', Vue:'#41b883', Python:'#3572A5',
  Java:'#b07219', Go:'#00ADD8', Rust:'#dea584', CSS:'#563d7c', HTML:'#e34c26',
  Shell:'#89e051', 'C++':'#f34b7d', 'C#':'#178600', PHP:'#4F5D95',
  Swift:'#F05138', Kotlin:'#A97BFF', Dart:'#00B4AB',
}

export default {
  name: 'FirstView',
  components: { bannerView, VueMarkdown, footerView, GravityShepherd },

  data() {
    return {
      bannerH: 0, locked: false, btnFlag: false,
      bannerImage: "", title: "首页",
      sidebarVisible: true, sidebarAvatar: "", sidebarAvatarSize: 110,
      sidebarName: "", sidebarBio: "", sidebarDivider: "🌴", sidebarBottomImg: "",
      pageBgImage: "", pageBgOpacity: 0.15,
      backtopVisible: true, backtopIcon: "",
      markdownContent: markdownRaw,
      ghUsername: 'Aloudname',
      ghLoading: true, ghUser: null, ghRepos: [], ghEvents: [],
      animated: {}, displayedBio: '', observer: null,
      gameActive: false, scrollCount: 0, lastScrollTime: 0,
      scrollDecayTimer: null, triggerProgress: 0,
      gameBgImage: '', gameGradient: ['#1a1a2e', '#0f3460'], gamePColor: '#00ff88',
    }
  },

  computed: {
    pageBgStyle() {
      if (!this.pageBgImage) return {}
      return { backgroundImage: `url(${this.pageBgImage})`, backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }
    },
    languages() { return calcLanguages(this.ghRepos) },
    topProjects() { return getTopProjects(this.ghRepos) },
    featuredProjects() {
      // 最近更新的 3 个非 fork 项目
      return this.ghRepos.filter(r => !r.fork).sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0,3)
    },
    activities() { return parseEvents(this.ghEvents) },
    totalStars() { return calcTotalStars(this.ghRepos) },
    statCards() {
      const u = this.ghUser || {}
      return [
        { icon:'📦', value: u.public_repos||0, label:'Repos' },
        { icon:'⭐', value: this.totalStars, label:'Stars' },
        { icon:'👥', value: u.followers||0, label:'Followers' },
        { icon:'🐙', value: u.following||0, label:'Following' },
      ]
    },
  },

  async created() {
    const [cfg] = await Promise.allSettled([getSectionConfig('about'), this.loadGitHub()])
    if (cfg.status === 'fulfilled' && cfg.value) {
      const c = cfg.value
      if (c.banner_image) this.bannerImage = c.banner_image
      if (c.banner_title) this.title = c.banner_title
      if (c.sidebar_visible !== undefined) this.sidebarVisible = c.sidebar_visible
      if (c.sidebar_avatar) this.sidebarAvatar = c.sidebar_avatar
      if (c.sidebar_avatar_size) this.sidebarAvatarSize = c.sidebar_avatar_size
      if (c.sidebar_name) this.sidebarName = c.sidebar_name
      if (c.sidebar_bio) this.sidebarBio = c.sidebar_bio
      if (c.sidebar_divider) this.sidebarDivider = c.sidebar_divider
      if (c.sidebar_bottom_img) this.sidebarBottomImg = c.sidebar_bottom_img
      if (c.page_bg_image) this.pageBgImage = c.page_bg_image
      if (c.page_bg_opacity !== undefined) this.pageBgOpacity = c.page_bg_opacity
      if (c.backtop_visible !== undefined) this.backtopVisible = c.backtop_visible
      if (c.backtop_icon) this.backtopIcon = c.backtop_icon
      if (c.markdown_content) this.markdownContent = c.markdown_content
      if (c.gh_username) this.ghUsername = c.gh_username
      if (c.game_bg_image) this.gameBgImage = c.game_bg_image
      if (c.game_gradient) this.gameGradient = c.game_gradient
      if (c.game_particle_color) this.gamePColor = c.game_particle_color
    }
  },

  mounted() {
    window.addEventListener("scroll", this.scrollToTop)
    window.addEventListener("wheel", this.onWheel, { passive: false })
    this.$nextTick(() => { if (this.$refs.banner) this.bannerH = this.$refs.banner.$el.offsetHeight })
    this.typeBio()
    // 注意：setupRevealObserver 在 GitHub 数据加载完成后调用，不在 mounted 中
  },
  destroyed() {
    window.removeEventListener("scroll", this.scrollToTop)
    window.removeEventListener("wheel", this.onWheel)
    if (this.observer) this.observer.disconnect()
  },

  methods: {
    async loadGitHub() {
      this.ghLoading = true
      try {
        const name = this.ghUsername || 'Aloudname'
        const [user, repos, events] = await Promise.all([
          getUser(name), getReposCached(name), getEventsCached(name),
        ])
        this.ghUser = user; this.ghRepos = repos; this.ghEvents = events
        this.ghLoading = false  // 必须在 $nextTick 前关闭 loading，否则模板仍渲染骨架屏
        await this.$nextTick()  // 此时 Vue 已渲染出 .reveal-section
        this.animateStats()
        this.setupRevealObserver()
      } catch (err) { console.warn('[FirstView] GitHub:', err.message) }
    },

    animateStats() {
      this.statCards.forEach((s, i) => {
        const target = s.value
        if (!target) return
        let current = 0
        const duration = 1200 + i * 200
        const step = Math.max(1, Math.floor(target / (duration / 16)))
        const timer = setInterval(() => {
          current = Math.min(current + step, target)
          this.$set(this.animated, s.label, current.toLocaleString())
          if (current >= target) clearInterval(timer)
        }, 16)
      })
    },

    typeBio() {
      const text = this.sidebarBio || this.ghUser?.bio || 'Welcome to my page!'
      let i = 0
      const timer = setInterval(() => { this.displayedBio = text.slice(0, i); i++; if (i > text.length) clearInterval(timer) }, 60)
    },

    onTilt(e) {
      const card = e.currentTarget; const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const mx = (x / rect.width - 0.5) * 10, my = (y / rect.height - 0.5) * -10
      card.style.transform = `perspective(600px) rotateX(${my}deg) rotateY(${mx}deg) scale3d(1.02,1.02,1.02)`
    },
    offTilt(e) { e.currentTarget.style.transform = '' },

    setupRevealObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') })
      }, { threshold: 0.15 })
      this.$nextTick(() => { document.querySelectorAll('.reveal-section').forEach(el => this.observer.observe(el)) })
    },

    // 游戏触发
    onWheel(e) {
      if (this.gameActive || window.scrollY > 15) return
      if (e.deltaY >= 0) return
      e.preventDefault(); const now = Date.now()
      if (this.lastScrollTime && now - this.lastScrollTime > DECAY_MS) this.scrollCount = 0
      this.scrollCount++; this.lastScrollTime = now
      this.triggerProgress = Math.min(1, this.scrollCount / TRIGGER_COUNT)
      clearTimeout(this.scrollDecayTimer)
      this.scrollDecayTimer = setTimeout(() => { this.scrollCount = 0; this.triggerProgress = 0 }, DECAY_MS)
      if (this.scrollCount >= TRIGGER_COUNT) { this.scrollCount = 0; this.triggerProgress = 0; this.gameActive = true; document.body.style.overflow = 'hidden' }
    },
    closeGame() { this.gameActive = false; document.body.style.overflow = '' },

    langColor(n) { return LANG_COLORS[n] || '#858585' },
    formatJoinDate(d) { return d ? new Date(d).toLocaleDateString('zh-CN',{year:'numeric',month:'long'}) : '' },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('zh-CN',{month:'short',day:'numeric'}) : '' },
    openUrl(url) { window.open(url, '_blank') },

    backTop() {
      const that = this
      let timer = setInterval(() => { let s = Math.floor(-that.scrollTop / 5); document.documentElement.scrollTop = document.body.scrollTop = that.scrollTop + s; if (that.scrollTop === 0) clearInterval(timer) }, 16)
    },
    scrollToTop() {
      let st = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      this.scrollTop = st; this.locked = this.btnFlag = st > this.bannerH
    },
  },
}
</script>
