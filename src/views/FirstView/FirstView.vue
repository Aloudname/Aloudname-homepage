<template>
  <div class="aboutBox">
    <bannerView
      :imgUrl="bannerImage"
      :titleName="title"
      ref="banner"
    ></bannerView>
    <div class="mainBox">
      <div class="contentBox">
        <div class="contentTitle">
          <div class="markdown-body">
            <VueMarkdown :source="markdownContent" />
          </div>
        </div>
      </div>
      <div :class="locked ? 'asideBoxFix' : 'asideBox'">
        <div class="asideImg">
          <el-avatar
            :src="sidebarAvatar"
            :size="size"
            class="asidePic"
          ></el-avatar>
        </div>
        <div class="asideTile">{{ sidebarName }}</div>
        <div class="asideTile1">{{ sidebarBio }}</div>
        <el-divider>🌴</el-divider>
        <img src="@/assets/huli.gif" alt="" class="bottomImg" />
      </div>
      <div v-if="btnFlag" class="go-top" @click="backTop">
        <img src="@/assets/backTop.png" alt="" class="backTopbtn" />
      </div>
    </div>
    <footerView></footerView>
  </div>
</template>

<script>
import bannerView from "@/components/bannerView/index"
import footerView from "@/components/footerView/index.vue"
import VueMarkdown from "vue-markdown"
// 使用 webpack asset/source 加载 .md 为纯文本字符串
import markdownRaw from "../home.md"
import pageConfigStore from '@/stores/pageConfig'
import "./css/FirstView.scss"
import "highlight.js/styles/github.css"
import "github-markdown-css"

export default {
  name: 'FirstView',
  components: { bannerView, VueMarkdown, footerView },

  data() {
    return {
      size: 90,
      bannerH: 0,
      locked: false,
      btnFlag: false,
      bannerImage: "",
      title: "首页",
      sidebarAvatar: "",
      sidebarName: "Aloudname",
      sidebarBio: "欢迎来到我的个人主页！",
      markdownContent: markdownRaw,
    }
  },

  async created() {
    // 从云端加载关于页配置
    try {
      await pageConfigStore.loadAll(['about'])
      const about = pageConfigStore.getSection('about')
      if (about.banner_image) this.bannerImage = about.banner_image
      if (about.banner_title) this.title = about.banner_title
      if (about.sidebar_avatar) this.sidebarAvatar = about.sidebar_avatar
      if (about.sidebar_name) this.sidebarName = about.sidebar_name
      if (about.sidebar_bio) this.sidebarBio = about.sidebar_bio
    } catch (err) {
      console.warn('[FirstView] 加载云端配置失败，使用默认值:', err.message)
    }
  },

  mounted() {
    window.addEventListener("scroll", this.scrollToTop)
    this.$nextTick(() => {
      if (this.$refs.banner) {
        this.bannerH = this.$refs.banner.$el.offsetHeight
      }
    })
  },

  destroyed() {
    window.removeEventListener("scroll", this.scrollToTop)
  },

  methods: {
    backTop() {
      const that = this
      let timer = setInterval(() => {
        let ispeed = Math.floor(-that.scrollTop / 5)
        document.documentElement.scrollTop = document.body.scrollTop =
          that.scrollTop + ispeed
        if (that.scrollTop === 0) {
          clearInterval(timer)
        }
      }, 16)
    },
    scrollToTop() {
      const that = this
      let scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop
      that.scrollTop = scrollTop
      that.locked = that.btnFlag = that.scrollTop > that.bannerH
      if (that.scrollTop > that.bannerH) {
        that.locked = true
        that.btnFlag = true
      } else {
        that.locked = false
        that.btnFlag = false
      }
    },
  },
}
</script>
