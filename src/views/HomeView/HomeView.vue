<template>
  <div class="home">
    <!-- ====== 区块1: 全屏 Banner（头像 + 打字机 + 导航） ====== -->
    <div
      class="hero-banner"
      :style="{ backgroundImage: bannerBgUrl ? `url(${bannerBgUrl})` : '' }"
    >
      <div class="hero-overlay">
        <div class="hero-nav">
          <div class="hero-logo">{{ siteTitle }}</div>
          <div class="hero-links">
            <span
              v-for="item in navItems"
              :key="item.path"
              class="hero-link"
              @click="goPage(item.path)"
            >{{ item.label }}</span>
          </div>
        </div>

        <div class="hero-center">
          <el-avatar :src="avatarUrl" :size="140" class="hero-avatar" />
          <div class="hero-name">{{ authorName }}</div>
          <el-divider class="hero-divider"></el-divider>

          <!-- 打字机文本 -->
          <div class="hero-typewriter" v-for="(v, k) in content" :key="k">
            <typewriter class="str" :str="v"></typewriter>
          </div>

          <!-- 导航按钮 -->
          <div class="hero-btns">
            <el-button round @click="goPage('about')" class="hero-btn">📖 关于我</el-button>
            <el-button round @click="goPage('blog')" class="hero-btn">📝 博客</el-button>
            <el-button round @click="scrollToPosts" class="hero-btn">🔥 最新文章</el-button>
          </div>

          <!-- 社交图标 -->
          <div class="hero-socials">
            <img
              v-for="(link, idx) in socialLinks"
              :key="idx"
              :src="getSocialIcon(link)"
              :alt="link.platform"
              class="social-icon"
              @click="handleSocialClick(link)"
              :title="link.platform"
            />
          </div>
        </div>

        <div class="hero-scroll-hint" @click="scrollToPosts">﹀</div>
      </div>
    </div>

    <!-- ====== 区块2: 最新博客文章列表 ====== -->
    <div class="posts-section" ref="postsSection">
      <div class="section-header">
        <h2>📝 最新文章</h2>
        <el-button type="text" @click="goPage('blog')">查看全部 →</el-button>
      </div>

      <div v-if="loadingPosts" class="loading-state">
        <i class="el-icon-loading" style="font-size:28px;"></i>
        <p>加载中...</p>
      </div>

      <div v-else-if="recentPosts.length" class="posts-grid">
        <div
          v-for="post in recentPosts"
          :key="post.id"
          class="post-card"
          @click="goPage('blog/' + post.slug)"
        >
          <div class="post-card-cover" v-if="post.cover_url">
            <img :src="post.cover_url" :alt="post.title" />
          </div>
          <div class="post-card-body">
            <h3 class="post-card-title">{{ post.title }}</h3>
            <p class="post-card-excerpt" v-if="post.excerpt">{{ post.excerpt }}</p>
            <div class="post-card-meta">
              <span>📅 {{ formatDate(post.created_at) }}</span>
              <el-tag
                v-for="tag in (post.tags || []).slice(0, 3)"
                :key="tag"
                size="mini"
              >{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>还没有文章，快去后台写一篇吧 ✍️</p>
      </div>
    </div>

    <!-- ====== 区块3: 页脚 ====== -->
    <div class="home-footer">
      <p>{{ copyrightText }}</p>
      <p v-if="icpNumber">
        <a href="https://beian.miit.gov.cn/" target="_blank" style="color:#999;">{{ icpNumber }}</a>
      </p>
    </div>

    <!-- 弹窗 -->
    <Popup
      :dialogTitle="dialogTitle"
      :visible.sync="dialogVisible"
      @updateVisible="updateVisible"
      @resetPopupData="resetPopupData"
      @submitPopupData="submitPopupData"
      @handleClose="handleClose"
      :popupWidth="'320px'"
    >
      <div class="dialog-body" v-html="dialogContent"></div>
    </Popup>
  </div>
</template>

<script>
import Popup from "@/components/dialogView/index.vue"
import typewriter from "./components/typewriter.vue"
import { getSectionConfig } from '@/services/pageConfigService'
import { getPublishedPosts } from '@/services/postsService'
import "./css/HomeView.scss"

export default {
  name: "HomeView",
  components: { Popup, typewriter },

  data() {
    return {
      // Banner 数据
      bannerBgUrl: '',
      siteTitle: 'chaichai.top',
      navItems: [
        { label: '首页', path: 'about' },
        { label: '博客', path: 'blog' },
      ],
      // 个人数据
      content: [],
      avatarUrl: "https://chaichaiimage.oss-cn-hangzhou.aliyuncs.com/blogimg/0d1b2cad168244918d2ee927bb664eb5.jpeg",
      authorName: "柴柴",
      typewriterTexts: [
        "嗨 欢迎来到 chaichai.top",
        "励志成为优秀且花里胡哨的程序员",
      ],
      socialLinks: [
        { platform: 'QQ', action: 'dialog', value: '2787922490' },
        { platform: 'GitHub', action: 'link', value: 'https://github.com/bbxx123' },
      ],
      // 文章
      recentPosts: [],
      loadingPosts: true,
      // 页脚
      copyrightText: "© 2024 版权所有",
      icpNumber: "",
      // 弹窗
      dialogVisible: false,
      dialogTitle: "",
      dialogContent: "",
    }
  },

  async created() {
    try {
      // 并行加载：页面配置 + 文章
      const [home, banner, footer, postsResult] = await Promise.all([
        getSectionConfig('home'),
        getSectionConfig('banner'),
        getSectionConfig('footer'),
        getPublishedPosts({ page: 1, pageSize: 6 }),
      ])

      // 首页配置
      if (home.avatar_url) this.avatarUrl = home.avatar_url
      if (home.author_name) this.authorName = home.author_name
      if (home.typewriter_texts?.length) this.typewriterTexts = home.typewriter_texts
      if (home.social_links?.length) this.socialLinks = home.social_links

      // Banner
      if (banner.title) this.siteTitle = banner.title
      if (banner.nav_items?.length) this.navItems = banner.nav_items
      if (banner.images?.length) this.bannerBgUrl = banner.images[0]

      // 页脚
      if (footer.copyright_text) this.copyrightText = footer.copyright_text
      if (footer.icp_number) this.icpNumber = footer.icp_number

      // 文章
      this.recentPosts = postsResult.posts
    } catch (err) {
      console.warn('[HomeView] 加载失败:', err.message)
    } finally {
      this.loadingPosts = false
    }
  },

  mounted() {
    this.startTypewriter()
  },

  methods: {
    startTypewriter() {
      this.content = []
      this.typewriterTexts.forEach((v, k) => {
        setTimeout(() => { this.content.push(v) }, k * 2500)
      })
    },

    goPage(path) {
      this.$router.push('/' + path.replace(/^\//, ''))
    },

    scrollToPosts() {
      const el = this.$refs.postsSection
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    },

    getSocialIcon(link) {
      if (link.platform === 'QQ') return require('@/assets/QQ.png')
      if (link.platform === 'GitHub') return require('@/assets/github.png')
      return link.icon || ''
    },

    handleSocialClick(link) {
      if (link.action === 'dialog') {
        this.dialogTitle = link.platform
        this.dialogContent = link.value || ''
        this.dialogVisible = true
      } else if (link.action === 'link') {
        window.open(link.value, '_blank')
      } else if (link.action === 'copy') {
        navigator.clipboard?.writeText(link.value || '')
        this.$message?.success('已复制') || alert('已复制: ' + link.value)
      }
    },

    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    },

    updateVisible(v) { this.dialogVisible = v },
    resetPopupData() { this.dialogVisible = false },
    submitPopupData() { this.dialogVisible = false },
    handleClose() { this.dialogVisible = false },
  },
}
</script>
