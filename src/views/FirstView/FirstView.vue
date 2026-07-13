<template>
  <div class="aboutBox" :style="pageBgStyle">
    <!-- 触发进度指示器（上滚时在顶部出现微光线） -->
    <div class="trigger-indicator" :class="{ active: triggerProgress > 0 }">
      <div class="trigger-glow" :style="{ width: triggerProgress * 100 + '%', opacity: triggerProgress }"></div>
    </div>

    <bannerView :imgUrl="bannerImage" :titleName="title" height="45vh" ref="banner" />

    <div class="mainBox">
      <!-- ====== 主内容区 ====== -->
      <div class="contentBox">
        <!-- 加载骨架 -->
        <div v-if="ghLoading">
          <div class="skeleton-grid">
            <div class="skel-card" v-for="n in 4" :key="n">
              <div class="skel-bar w60"></div><div class="skel-bar w40 skel-bar-short"></div>
            </div>
          </div>
        </div>

        <template v-else-if="ghUser">
          <!-- ====== 统计卡片（计数动画） ====== -->
          <div class="stats-row" ref="statsRow">
            <div class="stat-card tilt-card" v-for="s in statCards" :key="s.label"
              @mousemove="onTilt($event)" @mouseleave="offTilt($event)">
              <div class="stat-icon">{{ s.icon }}</div>
              <div class="stat-num" ref="statNums">{{ animated[s.label] || 0 }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>

          <!-- ====== 两栏: 技术栈 + 项目 ====== -->
          <div class="two-col">
            <!-- 技术栈 -->
            <div class="panel glass reveal-section" ref="revealEls">
              <div class="panel-head">🛠️ 技术栈</div>
              <div class="lang-bars" v-if="languages.length">
                <div class="lang-bar" v-for="(l, i) in languages" :key="l.name"
                  :style="{ animationDelay: i * 0.08 + 's' }">
                  <div class="lang-info">
                    <span class="lang-name">● {{ l.name }}</span>
                    <span class="lang-pct">{{ l.percent }}% · {{ l.count }} repos</span>
                  </div>
                  <div class="lang-track">
                    <div class="lang-fill" :style="{ width: l.percent + '%', background: l.color }"></div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-note">暂无数据</div>
            </div>

            <!-- 精选项目（3D 倾斜卡片） -->
            <div class="panel glass reveal-section" ref="revealEls">
              <div class="panel-head">📌 精选项目</div>
              <div class="project-list" v-if="topProjects.length">
                <div class="proj-item tilt-card" v-for="p in topProjects" :key="p.id"
                  @click="openUrl(p.html_url)" @mousemove="onTilt($event)" @mouseleave="offTilt($event)">
                  <div class="proj-top">
                    <span class="proj-name">📁 {{ p.name }}</span>
                    <span class="proj-stars">⭐ {{ p.stargazers_count }}</span>
                  </div>
                  <div class="proj-desc" v-if="p.description">{{ p.description }}</div>
                  <div class="proj-meta">
                    <span v-if="p.language" class="proj-lang">
                      <i class="lang-dot" :style="{ background: langColor(p.language) }"></i>
                      {{ p.language }}
                    </span>
                    <span v-if="p.forks_count">🍴 {{ p.forks_count }}</span>
                    <span v-if="p.open_issues_count">⚠️ {{ p.open_issues_count }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-note">暂无项目</div>
            </div>
          </div>

          <!-- ====== 最近动态（交互时间线） ====== -->
          <div class="panel glass reveal-section" ref="revealEls">
            <div class="panel-head">📅 最近动态</div>
            <div class="activity-list" v-if="activities.length">
              <div class="act-item" v-for="(a, i) in activities" :key="i"
                :style="{ animationDelay: i * 0.04 + 's' }"
                @mouseenter="a._hover = true" @mouseleave="a._hover = false">
                <span class="act-dot" :class="{ pulse: i < 3 }"></span>
                <span class="act-icon">{{ a.icon }}</span>
                <span class="act-verb">{{ a.verb }}</span>
                <span class="act-repo">{{ a.repo }}</span>
                <span class="act-time">{{ a.timeAgo }}</span>
              </div>
            </div>
            <div v-else class="empty-note">暂无动态</div>
          </div>
        </template>

        <!-- Markdown 回退 -->
        <div v-else-if="markdownContent" class="contentTitle reveal-section" ref="revealEls">
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
          <div v-if="ghUser.company" class="aside-row">🏢 {{ ghUser.company }}</div>
          <div class="aside-row">📅 Joined {{ formatJoinDate(ghUser.created_at) }}</div>
        </div>
        <img v-if="sidebarBottomImg" :src="sidebarBottomImg" alt="" class="bottomImg" />
      </div>

      <!-- 返回顶部 -->
      <div v-if="backtopVisible && btnFlag" class="go-top" @click="backTop">
        <img :src="backtopIcon || require('@/assets/backTop.png')" alt="" class="backTopbtn" />
      </div>
    </div>

    <footerView />

    <!-- ====== 隐藏粒子游戏 ====== -->
    <transition name="game-reveal">
      <GravityShepherd
        v-if="gameActive"
        :bgImage="gameBgImage"
        :gradient="gameGradient"
        :particleColor="gamePColor"
        @close="closeGame"
      />
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

// 隐藏游戏懒加载
const GravityShepherd = () => import('@/views/public/GravityShepherd.vue')

const TRIGGER_COUNT = 8    // 连续上滚 8 次触发
const DECAY_MS = 400       // 400ms 内没有下一次上滚则计数归零

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
      // 交互状态
      animated: {},
      displayedBio: '',
      observer: null,
      // 隐藏游戏
      gameActive: false,
      scrollCount: 0,        // 连续上滚计数
      lastScrollTime: 0,     // 上次上滚时间戳
      scrollDecayTimer: null, // 衰减定时器
      triggerProgress: 0,    // 0-1 触发进度（用于视觉提示）
      gameBgImage: '',
      gameGradient: ['#1a1a2e', '#0f3460'],
      gamePColor: '#00ff88',
    }
  },

  computed: {
    pageBgStyle() {
      if (!this.pageBgImage) return {}
      return { backgroundImage: `url(${this.pageBgImage})`, backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }
    },
    languages() { return calcLanguages(this.ghRepos) },
    topProjects() { return getTopProjects(this.ghRepos) },
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
    const [cfg] = await Promise.allSettled([
      getSectionConfig('about'),
      this.loadGitHub(),
    ])
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
      // 游戏配置
      if (c.game_bg_image) this.gameBgImage = c.game_bg_image
      if (c.game_gradient) this.gameGradient = c.game_gradient
      if (c.game_particle_color) this.gamePColor = c.game_particle_color
    }
  },

  mounted() {
    window.addEventListener("scroll", this.scrollToTop)
    window.addEventListener("wheel", this.onWheel, { passive: false })
    this.$nextTick(() => {
      if (this.$refs.banner) this.bannerH = this.$refs.banner.$el.offsetHeight
    })
    // 打字效果
    this.typeBio()
    // 滚动揭示
    this.setupRevealObserver()
  },

  destroyed() {
    window.removeEventListener("scroll", this.scrollToTop)
    window.removeEventListener("wheel", this.onWheel)
    if (this.observer) this.observer.disconnect()
  },

  methods: {
    // ====== GitHub 加载 ======
    async loadGitHub() {
      this.ghLoading = true
      try {
        const name = this.ghUsername || 'Aloudname'
        const [user, repos, events] = await Promise.all([
          getUser(name), getReposCached(name), getEventsCached(name),
        ])
        this.ghUser = user; this.ghRepos = repos; this.ghEvents = events
        await this.$nextTick()
        this.animateStats()
      } catch (err) {
        console.warn('[FirstView] GitHub:', err.message)
      } finally { this.ghLoading = false }
    },

    // ====== 计数动画 ======
    animateStats() {
      this.statCards.forEach((s, i) => {
        const target = s.value
        if (!target) return
        const key = s.label
        let current = 0
        const duration = 1200 + i * 200
        const step = Math.max(1, Math.floor(target / (duration / 16)))
        const timer = setInterval(() => {
          current = Math.min(current + step, target)
          this.$set(this.animated, key, current.toLocaleString())
          if (current >= target) clearInterval(timer)
        }, 16)
      })
    },

    // ====== 打字效果 ======
    typeBio() {
      const text = this.sidebarBio || this.ghUser?.bio || 'Welcome to my page!'
      let i = 0
      const timer = setInterval(() => {
        this.displayedBio = text.slice(0, i)
        i++
        if (i > text.length) clearInterval(timer)
      }, 60)
    },

    // ====== 3D 倾斜 ======
    onTilt(e) {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const mx = (x / rect.width - 0.5) * 10
      const my = (y / rect.height - 0.5) * -10
      card.style.transform = `perspective(600px) rotateX(${my}deg) rotateY(${mx}deg) scale3d(1.02,1.02,1.02)`
    },
    offTilt(e) {
      e.currentTarget.style.transform = ''
    },

    // ====== 滚动揭示 ======
    setupRevealObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
          }
        })
      }, { threshold: 0.15 })

      this.$nextTick(() => {
        document.querySelectorAll('.reveal-section').forEach(el => {
          this.observer.observe(el)
        })
      })
    },

    // ====== 隐藏游戏：连续上滚触发 ======
    onWheel(e) {
      if (this.gameActive) return
      // 仅在页面顶部时响应上滚触发（允许少量偏移）
      if (window.scrollY > 15) return

      // 向下滚不重置（避免触控板抖动误杀），仅忽略
      if (e.deltaY >= 0) return

      // 向上滚 → 计数+1
      e.preventDefault()
      const now = Date.now()

      // 超过衰减窗口 → 重新计数
      if (this.lastScrollTime && now - this.lastScrollTime > DECAY_MS) {
        this.scrollCount = 0
      }

      this.scrollCount++
      this.lastScrollTime = now
      this.triggerProgress = Math.min(1, this.scrollCount / TRIGGER_COUNT)

      // 重置衰减定时器
      clearTimeout(this.scrollDecayTimer)
      this.scrollDecayTimer = setTimeout(() => {
        this.resetScrollCount()
      }, DECAY_MS)

      if (this.scrollCount >= TRIGGER_COUNT) {
        this.activateGame()
      }
    },

    resetScrollCount() {
      this.scrollCount = 0
      this.lastScrollTime = 0
      this.triggerProgress = 0
      clearTimeout(this.scrollDecayTimer)
    },

    activateGame() {
      this.resetScrollCount()
      this.gameActive = true
      document.body.style.overflow = 'hidden'
    },

    closeGame() {
      this.gameActive = false
      document.body.style.overflow = ''
    },

    // ====== 工具 ======
    langColor(n) { return LANG_COLORS[n] || '#858585' },
    formatJoinDate(d) { return d ? new Date(d).toLocaleDateString('zh-CN',{year:'numeric',month:'long'}) : '' },
    openUrl(url) { window.open(url, '_blank') },

    backTop() {
      const that = this
      let timer = setInterval(() => {
        let s = Math.floor(-that.scrollTop / 5)
        document.documentElement.scrollTop = document.body.scrollTop = that.scrollTop + s
        if (that.scrollTop === 0) clearInterval(timer)
      }, 16)
    },
    scrollToTop() {
      let st = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      this.scrollTop = st
      this.locked = this.btnFlag = st > this.bannerH
    },
  },
}
</script>
