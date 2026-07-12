<template>
  <div class="home">
    <div class="coverBox">
      <div class="centerBox">
        <!-- 头像 — 从 page_config 加载 -->
        <el-avatar
          :src="avatarUrl"
          :size="150"
          class="picT"
        ></el-avatar>
        <!-- 作者姓名 — 从 page_config 加载 -->
        <div class="ahtuorName">{{ authorName }}</div>
        <el-divider class="divider"></el-divider>
        <!-- 打字机文本 — 从 page_config 加载 -->
        <div class="title" v-for="(v, k) in content" :key="k">
          <typewriter class="str" :str="v"></typewriter>
        </div>
        <!-- 导航按钮 -->
        <div class="btnBox">
          <el-button round @click="$router.push('/about')" class="btnStyle">首页</el-button>
          <el-button round @click="$router.push('/blog')" class="btnStyle">博客</el-button>
          <el-button round @click="$router.push('/admin')" class="btnStyle">后台</el-button>
        </div>
        <!-- 社交链接 — 从 page_config 动态渲染 -->
        <div class="continueBox">
          <template v-for="(link, idx) in socialLinks">
            <img
              v-if="link.platform === 'QQ'"
              :key="'qq'"
              src="@/assets/QQ.png"
              alt="QQ"
              class="logoimg"
              @click="handleSocialClick(link)"
            />
            <img
              v-else-if="link.platform === 'GitHub'"
              :key="'gh'"
              src="@/assets/github.png"
              alt="GitHub"
              class="logoimg"
              @click="handleSocialClick(link)"
            />
            <img
              v-else
              :key="idx"
              :src="link.icon || ''"
              :alt="link.platform"
              class="logoimg"
              @click="handleSocialClick(link)"
            />
          </template>
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
          <div class="go433Box">
            <div v-if="dialogContent" v-html="dialogContent"></div>
          </div>
        </Popup>
      </div>
      <!-- 页脚 — 从 page_config 加载 -->
      <div class="footerBox">
        {{ copyrightText }}<br />
        <a v-if="icpNumber" href="https://beian.miit.gov.cn/" style="color: #fff" target="_blank">{{ icpNumber }}</a>
      </div>
    </div>
  </div>
</template>

<script>
import Popup from "@/components/dialogView/index.vue"
import typewriter from "./components/typewriter.vue"
import pageConfigStore from '@/stores/pageConfig'
import "./css/HomeView.scss"

export default {
  name: "HomeView",
  components: { Popup, typewriter },

  data() {
    return {
      content: [],
      avatarUrl: "https://chaichaiimage.oss-cn-hangzhou.aliyuncs.com/blogimg/0d1b2cad168244918d2ee927bb664eb5.jpeg",
      authorName: "柴柴",
      typewriterTexts: [
        "嗨 欢迎来到chaichai.top",
        "励志成为优秀且花里胡哨的程序员，并在努力奋斗",
        "CQUCC-4-433正在找寻志同道合的小伙伴，欢迎前端、后端、UI加入我们！",
      ],
      socialLinks: [
        { platform: 'QQ', action: 'dialog', value: '2787922490' },
        { platform: 'GitHub', action: 'link', value: 'https://github.com/bbxx123' },
      ],
      copyrightText: "© 2024 版权所有",
      icpNumber: "",
      dialogVisible: false,
      dialogTitle: "GitHub",
      dialogContent: "",
    }
  },

  async created() {
    try {
      await pageConfigStore.loadAll(['home', 'footer'])
      const home = pageConfigStore.getSection('home')
      const footer = pageConfigStore.getSection('footer')

      if (home.avatar_url) this.avatarUrl = home.avatar_url
      if (home.author_name) this.authorName = home.author_name
      if (home.typewriter_texts?.length) this.typewriterTexts = home.typewriter_texts
      if (home.social_links?.length) this.socialLinks = home.social_links
      if (footer.copyright_text) this.copyrightText = footer.copyright_text
      if (footer.icp_number) this.icpNumber = footer.icp_number
    } catch (err) {
      console.warn('[HomeView] 加载云端配置失败，使用默认值:', err.message)
    }
  },

  mounted() {
    this.setTime()
  },

  methods: {
    setTime() {
      var arr = this.typewriterTexts
      var that = this
      arr.forEach(function (v, k) {
        setTimeout(function () {
          that.content.push(v)
        }, k * 2500)
      })
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
        this.$message?.success('已复制到剪贴板') || alert('已复制: ' + link.value)
      }
    },
    updateVisible(val) { this.dialogVisible = val },
    resetPopupData() { this.dialogVisible = false },
    async submitPopupData() { this.dialogVisible = false },
    handleClose() { this.dialogVisible = false },
  },
}
</script>
