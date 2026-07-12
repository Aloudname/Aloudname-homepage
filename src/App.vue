<template>
  <div id="app">
    <!-- 动态背景（所有页面共享，管理后台除外） -->
    <particleBg
      v-if="!isAdminRoute"
      :config="bgConfig"
    />

    <!-- 自定义光标特效（所有页面共享，管理后台除外） -->
    <cursorEffect
      v-if="!isAdminRoute"
      :config="cursorConfig"
    />

    <!-- 页面过渡动画 -->
    <transition
      class="auto-scroll"
      appear
      name="animate__animated animate__bounce"
      enter-active-class="animate__backInUp animate__slow"
      leave-active-class="animate__fadeOutDownBig contron"
    >
      <router-view
        style="-webkit-backface-visibility: hidden"
        :key="$route.path"
      />
    </transition>

    <!-- 背景音乐（仅在公开页面显示） -->
    <audio
      v-if="!isAdminRoute"
      :src="musicUrl"
      loop
      autoplay
      ref="au"
    />
  </div>
</template>

<script>
import pageConfigStore from '@/stores/pageConfig'
import particleBg from '@/components/particleBg/index.vue'
import cursorEffect from '@/components/cursorEffect/index.vue'

export default {
  components: { particleBg, cursorEffect },

  data() {
    return {
      bgConfig: {},
      cursorConfig: {},
      musicUrl: '',
    }
  },

  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    },
  },

  async created() {
    // 加载全局页面配置（首次访问时）
    try {
      await pageConfigStore.loadAll()
      this.applyConfig()
    } catch (err) {
      console.error('[App] 加载页面配置失败:', err)
      // 失败时使用默认配置，不影响页面渲染
    }
  },

  watch: {
    $route() {
      // 路由切换时确保配置已加载
      if (!this.isAdminRoute) {
        this.applyConfig()
      }
    },
  },

  mounted() {
    // 用户首次点击时解锁音频自动播放（浏览器策略）
    document.addEventListener('click', this.unlockAudio, { once: true })
  },

  beforeDestroy() {
    document.removeEventListener('click', this.unlockAudio)
  },

  methods: {
    applyConfig() {
      this.bgConfig = pageConfigStore.getSection('background')
      this.cursorConfig = pageConfigStore.getSection('cursor')

      const musicCfg = pageConfigStore.getSection('music')
      if (musicCfg?.enabled && musicCfg?.playlist?.length) {
        this.musicUrl = musicCfg.playlist[0].url
      }

      // 动态更新 favicon
      const globalCfg = pageConfigStore.getSection('global')
      if (globalCfg?.favicon_url) {
        let link = document.querySelector('link[rel="icon"]')
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = globalCfg.favicon_url
      }

      // 动态更新页面标题
      if (globalCfg?.site_title) {
        document.title = globalCfg.site_title
      }
    },

    unlockAudio(e) {
      if (e.isTrusted && this.$refs.au) {
        this.$refs.au.play().catch(() => {
          // 浏览器可能仍然阻止自动播放，忽略
        })
      }
    },
  },
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  user-select: none;
  text-decoration: none;
  list-style: none;
}

.contron {
  display: none;
}

#app {
  position: relative;
  z-index: 1; /* 底层图(0) < 内容(1) < 粒子(3) < 光标(9999) */
  overflow-x: hidden;
  background: transparent;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>

<style lang="scss">
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-thumb {
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
  background: #cccfd9;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0);
}

.auto-scroll {
  overflow: overlay;
}

.auto-scroll ::-webkit-scrollbar {
  display: none;
}

.auto-scroll:hover ::-webkit-scrollbar {
  display: block;
}
</style>

<style>
:root {
  --animate-duration: 0.5s !important;
  --animate-delay: 0.5s !important;
  --animate-repeat: 0.5s !important;
}
</style>
