<template>
  <div class="aboutBox" :style="pageBgStyle">
    <bannerView :imgUrl="bannerImage" :titleName="title" ref="banner" />

    <div class="mainBox">
      <div class="contentBox">
        <div class="contentTitle">
          <div class="markdown-body">
            <VueMarkdown :source="markdownContent" />
          </div>
        </div>
      </div>

      <!-- 侧边栏（可关闭） -->
      <div v-if="sidebarVisible" :class="locked ? 'asideBoxFix' : 'asideBox'">
        <div class="asideImg">
          <el-avatar :src="sidebarAvatar" :size="sidebarAvatarSize" class="asidePic" />
        </div>
        <div class="asideTile">{{ sidebarName }}</div>
        <div class="asideTile1">{{ sidebarBio }}</div>
        <el-divider>{{ sidebarDivider }}</el-divider>
        <img v-if="sidebarBottomImg" :src="sidebarBottomImg" alt="" class="bottomImg" />
      </div>

      <!-- 返回顶部按钮（可关闭） -->
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
import "./css/FirstView.scss"
import "highlight.js/styles/github.css"
import "github-markdown-css"

export default {
  name: 'FirstView',
  components: { bannerView, VueMarkdown, footerView },

  data() {
    return {
      size: 90,
      bannerH: 0, locked: false, btnFlag: false,
      // 从云端加载
      bannerImage: "",
      title: "首页",
      sidebarVisible: true,
      sidebarAvatar: "",
      sidebarAvatarSize: 90,
      sidebarName: "",
      sidebarBio: "",
      sidebarDivider: "🌴",
      sidebarBottomImg: "",
      pageBgImage: "",
      pageBgOpacity: 0.15,
      backtopVisible: true,
      backtopIcon: "",
      markdownContent: markdownRaw,
    }
  },

  computed: {
    pageBgStyle() {
      if (!this.pageBgImage) return {}
      return {
        backgroundImage: `url(${this.pageBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        opacity: this.pageBgOpacity,
      }
    },
  },

  async created() {
    try {
      const cfg = await getSectionConfig('about')
      if (cfg.banner_image) this.bannerImage = cfg.banner_image
      if (cfg.banner_title) this.title = cfg.banner_title
      if (cfg.sidebar_visible !== undefined) this.sidebarVisible = cfg.sidebar_visible
      if (cfg.sidebar_avatar) this.sidebarAvatar = cfg.sidebar_avatar
      if (cfg.sidebar_avatar_size) this.sidebarAvatarSize = cfg.sidebar_avatar_size
      if (cfg.sidebar_name) this.sidebarName = cfg.sidebar_name
      if (cfg.sidebar_bio) this.sidebarBio = cfg.sidebar_bio
      if (cfg.sidebar_divider) this.sidebarDivider = cfg.sidebar_divider
      if (cfg.sidebar_bottom_img) this.sidebarBottomImg = cfg.sidebar_bottom_img
      if (cfg.page_bg_image) this.pageBgImage = cfg.page_bg_image
      if (cfg.page_bg_opacity !== undefined) this.pageBgOpacity = cfg.page_bg_opacity
      if (cfg.backtop_visible !== undefined) this.backtopVisible = cfg.backtop_visible
      if (cfg.backtop_icon) this.backtopIcon = cfg.backtop_icon
      if (cfg.markdown_content) this.markdownContent = cfg.markdown_content
    } catch (err) {
      console.warn('[FirstView] 加载云端配置失败:', err.message)
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
    backTop() {
      const that = this
      let timer = setInterval(() => {
        let ispeed = Math.floor(-that.scrollTop / 5)
        document.documentElement.scrollTop = document.body.scrollTop = that.scrollTop + ispeed
        if (that.scrollTop === 0) clearInterval(timer)
      }, 16)
    },
    scrollToTop() {
      const that = this
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      that.scrollTop = scrollTop
      that.locked = that.btnFlag = that.scrollTop > that.bannerH
    },
  },
}
</script>
