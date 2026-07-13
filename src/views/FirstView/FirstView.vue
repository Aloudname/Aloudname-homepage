<template>
  <div class="aboutBox" :style="pageBgStyle">
    <bannerView :imgUrl="bannerImage" :titleName="title" ref="banner" />

    <div class="mainBox">
      <!-- ====== 主内容区: GitHub 数据面板 ====== -->
      <div class="contentBox">
        <div v-if="ghLoading" class="loading-card">
          <i class="el-icon-loading"></i> 加载 GitHub 数据中...
        </div>

        <template v-else-if="ghUser">
          <!-- 统计卡片 -->
          <div class="stats-row">
            <div class="stat-card" v-for="s in statCards" :key="s.label">
              <div class="stat-icon">{{ s.icon }}</div>
              <div class="stat-num">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>

          <!-- 技术栈 + 项目 两栏 -->
          <div class="two-col">
            <!-- 左侧: 技术栈 -->
            <div class="panel glass">
              <div class="panel-head">🛠️ 技术栈</div>
              <div class="lang-bars" v-if="languages.length">
                <div class="lang-bar" v-for="l in languages" :key="l.name">
                  <div class="lang-info">
                    <span class="lang-name">{{ l.name }}</span>
                    <span class="lang-pct">{{ l.percent }}%</span>
                  </div>
                  <div class="lang-track">
                    <div class="lang-fill" :style="{ width: l.percent + '%', background: l.color }"></div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-note">暂无数据</div>
            </div>

            <!-- 右侧: 精选项目 -->
            <div class="panel glass">
              <div class="panel-head">📌 精选项目</div>
              <div class="project-list" v-if="topProjects.length">
                <div class="proj-item" v-for="p in topProjects" :key="p.id"
                  @click="openUrl(p.html_url)">
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
                  </div>
                </div>
              </div>
              <div v-else class="empty-note">暂无项目</div>
            </div>
          </div>

          <!-- 最近活动 -->
          <div class="panel glass">
            <div class="panel-head">📅 最近动态</div>
            <div class="activity-list" v-if="activities.length">
              <div class="act-item" v-for="(a, i) in activities" :key="i">
                <span class="act-icon">{{ a.icon }}</span>
                <span class="act-verb">{{ a.verb }}</span>
                <span class="act-repo">{{ a.repo }}</span>
                <span class="act-time">{{ a.timeAgo }}</span>
              </div>
            </div>
            <div v-else class="empty-note">暂无动态</div>
          </div>
        </template>

        <!-- GitHub 数据不可用时的回退: Markdown 内容 -->
        <div v-else-if="markdownContent" class="contentTitle">
          <div class="markdown-body">
            <VueMarkdown :source="markdownContent" />
          </div>
        </div>
      </div>

      <!-- ====== 侧边栏 ====== -->
      <div v-if="sidebarVisible" :class="locked ? 'asideBoxFix' : 'asideBox'">
        <div class="asideImg">
          <el-avatar :src="sidebarAvatar || ghUser?.avatar_url" :size="sidebarAvatarSize" class="asidePic" />
        </div>
        <div class="asideTile">{{ sidebarName || ghUser?.login || '' }}</div>
        <div class="asideTile1">{{ sidebarBio || ghUser?.bio || '' }}</div>
        <el-divider>{{ sidebarDivider }}</el-divider>
        <!-- GitHub 额外信息 -->
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
  </div>
</template>

<script>
import bannerView from "@/components/bannerView/index"
import footerView from "@/components/footerView/index.vue"
import VueMarkdown from "vue-markdown"
import markdownRaw from "../home.md"
import { getSectionConfig } from '@/services/pageConfigService'
import { getUser, getRepos, getEvents, calcLanguages, getTopProjects, calcTotalStars, parseEvents } from '@/services/githubService'
import "./css/FirstView.scss"
import "highlight.js/styles/github.css"
import "github-markdown-css"

const LANG_COLORS = {
  JavaScript:'#f1e05a', TypeScript:'#3178c6', Vue:'#41b883', Python:'#3572A5',
  Java:'#b07219', Go:'#00ADD8', Rust:'#dea584', CSS:'#563d7c', HTML:'#e34c26',
  Shell:'#89e051', 'C++':'#f34b7d', 'C#':'#178600', PHP:'#4F5D95',
  Swift:'#F05138', Kotlin:'#A97BFF', Dart:'#00B4AB',
}

export default {
  name: 'FirstView',
  components: { bannerView, VueMarkdown, footerView },

  data() {
    return {
      bannerH: 0, locked: false, btnFlag: false,
      // 云端配置
      bannerImage: "", title: "首页",
      sidebarVisible: true, sidebarAvatar: "", sidebarAvatarSize: 90,
      sidebarName: "", sidebarBio: "", sidebarDivider: "🌴", sidebarBottomImg: "",
      pageBgImage: "", pageBgOpacity: 0.15,
      backtopVisible: true, backtopIcon: "",
      markdownContent: markdownRaw,
      ghUsername: 'Aloudname',
      // GitHub 数据
      ghLoading: true, ghUser: null, ghRepos: [], ghEvents: [],
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
        { icon:'📦', value: u.public_repos||0, label:'仓库' },
        { icon:'⭐', value: this.totalStars, label:'Stars' },
        { icon:'👥', value: u.followers||0, label:'Followers' },
        { icon:'📌', value: u.public_gists||0, label:'Gists' },
      ]
    },
  },

  async created() {
    // 并行加载: 页面配置 + GitHub 数据
    const [cfg, , , ] = await Promise.allSettled([
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
    }
  },

  mounted() {
    window.addEventListener("scroll", this.scrollToTop)
    this.$nextTick(() => {
      if (this.$refs.banner) this.bannerH = this.$refs.banner.$el.offsetHeight
    })
  },
  destroyed() { window.removeEventListener("scroll", this.scrollToTop) },

  methods: {
    async loadGitHub() {
      this.ghLoading = true
      try {
        const name = this.ghUsername || 'Aloudname'
        const [user, repos, events] = await Promise.all([
          getUser(name), getRepos(name), getEvents(name),
        ])
        this.ghUser = user; this.ghRepos = repos; this.ghEvents = events
      } catch (err) {
        console.warn('[FirstView] GitHub 数据加载失败:', err.message)
      } finally { this.ghLoading = false }
    },

    langColor(name) { return LANG_COLORS[name] || '#858585' },
    formatJoinDate(d) { return d ? new Date(d).toLocaleDateString('zh-CN',{year:'numeric',month:'long'}) : '' },
    openUrl(url) { window.open(url, '_blank') },

    backTop() {
      const that = this
      let timer = setInterval(() => {
        let ispeed = Math.floor(-that.scrollTop / 5)
        document.documentElement.scrollTop = document.body.scrollTop = that.scrollTop + ispeed
        if (that.scrollTop === 0) clearInterval(timer)
      }, 16)
    },
    scrollToTop() {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      this.scrollTop = scrollTop
      this.locked = this.btnFlag = scrollTop > this.bannerH
    },
  },
}
</script>
