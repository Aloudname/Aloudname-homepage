<template>
  <div>
    <div
      class="bannerBox"
      :style="{ background: 'url(' + imgUrl + ')', backgroundSize: 'cover' }"
    >
      <div class="coverBox">
        <div class="navBox">
          <!-- 网站标题 — 支持动态 props 或默认值 -->
          <div class="topTitle">{{ siteTitle }}</div>
          <el-menu
            class="el-menu-demo"
            mode="horizontal"
            @select="handleSelect"
            collapse-transition
            background-color="#0000001D"
            router
            text-color="#fff"
            menu-trigger="click"
          >
            <!-- 导航项 — 优先使用 props 传入的动态数据 -->
            <el-menu-item
              v-for="item in navItems"
              :key="item.path"
              :index="item.path"
            >{{ item.label }}</el-menu-item>

            <!-- 友链子菜单 -->
            <el-submenu v-if="friendLinks.length" index="friends">
              <template slot="title">友链</template>
              <el-menu-item
                v-for="(link, idx) in friendLinks"
                :key="idx"
                :index="'friend-' + idx"
                class="friendList"
              >
                <img
                  v-if="link.icon"
                  :src="link.icon"
                  alt=""
                  class="friendIco"
                />
                <a :href="link.url" style="color: #fff" target="_blank">{{ link.name }}</a>
              </el-menu-item>
            </el-submenu>
          </el-menu>
        </div>
        <div class="centerTile">{{ titleName }}</div>
        <div class="icon">﹀</div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSectionConfig } from '@/services/pageConfigService'

export default {
  name: 'bannerView',

  props: {
    imgUrl: { required: true },
    titleName: { required: true },
  },

  data() {
    return {
      siteTitle: '',
      navItems: [
        { label: '首页', path: 'about' },
        { label: '博客', path: 'blog' },
      ],
      friendLinks: [],
    }
  },

  async created() {
    try {
      // 直接从 Supabase 读取，不经过 store（与 BannerEditor 完全对称）
      const banner = await getSectionConfig('banner')
      if (banner.title) this.siteTitle = banner.title
      if (banner.nav_items?.length) this.navItems = banner.nav_items
      if (banner.friend_links?.length) this.friendLinks = banner.friend_links
    } catch (err) {
      console.warn('[bannerView] 加载云端配置失败，使用默认值:', err.message)
    }
  },

  methods: {
    handleSelect(key, keyPath) {
      // 友链点击处理
      if (key.startsWith('friend-')) {
        const idx = parseInt(key.replace('friend-', ''))
        const link = this.friendLinks[idx]
        if (link?.url && link.url !== '#') {
          window.open(link.url, '_blank')
        }
      }
    },
  },
}
</script>

<style lang="scss">
.bannerBox {
  width: 100vw;
  height: 100vh;
  background-size: cover;
  overflow: hidden;
}
.coverBox {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);

  .navBox {
    height: 60px;
    display: flex;
    flex-wrap: nowrap;
    line-height: 60px;
    justify-content: space-between;
    padding: 20px 35px 0 35px;

    .topTitle {
      width: 300px;
      text-align: left;
      color: #fff;
      font-size: 38px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .el-menu {
      background-color: rgb(0, 0, 0, 0) !important;
      border: 0px;
    }
    .el-menu-item {
      font-size: 18px;
      font-weight: 600;
      background-color: rgb(0, 0, 0, 0) !important;
    }
    .el-submenu__title {
      font-size: 18px !important;
      font-weight: 600;
      background-color: rgb(0, 0, 0, 0) !important;
    }
  }
  .centerTile {
    width: 100%;
    line-height: 70vh;
    color: #fff;
    font-size: 38px;
    font-weight: 900;
    letter-spacing: 8px;
  }
  .icon {
    margin-top: 30px;
    z-index: 99999;
    font-weight: 900;
    font-size: 35px;
    color: #fff;
  }
}
</style>

<style>
.friendIco {
  display: inline-block;
  width: 25px;
  margin: 0 3px;
  vertical-align: middle;
}
.friendList {
  height: 80px !important;
  line-height: 80px !important;
  margin: 5px auto;
  text-align: center;
}
</style>
