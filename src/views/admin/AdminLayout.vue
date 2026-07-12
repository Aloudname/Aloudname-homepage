<!--
  管理后台整体布局
  左侧边栏 + 顶部栏 + 内容区
-->
<template>
  <div class="admin-layout">
    <!-- 左侧边栏 -->
    <div class="admin-sidebar">
      <div class="sidebar-header">🎨 页面管理</div>

      <el-menu
        :default-active="activeMenu"
        background-color="#1d1e2c"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#42b983"
        router
        :collapse="false"
      >
        <el-menu-item index="/admin/dashboard">
          <i class="el-icon-s-data"></i>
          <span>仪表盘</span>
        </el-menu-item>

        <el-submenu index="editor-group">
          <template slot="title">
            <i class="el-icon-edit-outline"></i>
            <span>页面编辑器</span>
          </template>
          <el-menu-item index="/admin/editor/bg">
            <i class="el-icon-picture-outline"></i>
            <span>🌄 动态背景</span>
          </el-menu-item>
          <el-menu-item index="/admin/editor/cursor">
            <i class="el-icon-s-custom"></i>
            <span>🖱️ 鼠标指针</span>
          </el-menu-item>
          <el-menu-item index="/admin/editor/music">
            <i class="el-icon-headset"></i>
            <span>🎵 背景音乐</span>
          </el-menu-item>
          <el-menu-item index="/admin/editor/banner">
            <i class="el-icon-film"></i>
            <span>🏠 Banner</span>
          </el-menu-item>
          <el-menu-item index="/admin/editor/content">
            <i class="el-icon-document"></i>
            <span>📝 首页内容</span>
          </el-menu-item>
          <el-menu-item index="/admin/editor/about">
            <i class="el-icon-user"></i>
            <span>📖 关于页</span>
          </el-menu-item>
        </el-submenu>

        <el-menu-item index="/admin/posts">
          <i class="el-icon-notebook-2"></i>
          <span>📄 文章管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/pages">
          <i class="el-icon-document-copy"></i>
          <span>📑 页面管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/assets">
          <i class="el-icon-folder-opened"></i>
          <span>🖼️ 资源管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/settings">
          <i class="el-icon-setting"></i>
          <span>⚙️ 全局设置</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容区 -->
    <div class="admin-main">
      <!-- 顶部栏 -->
      <div class="admin-topbar">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">管理后台</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <span>{{ userEmail }}</span>
          <el-button type="danger" size="mini" plain @click="handleLogout">退出</el-button>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import authStore from '@/stores/auth'
import { signOut, getCurrentUser } from '@/services/authService'

export default {
  name: 'AdminLayout',

  data() {
    return {
      userEmail: '',
    }
  },

  computed: {
    activeMenu() {
      return this.$route.path
    },
    currentTitle() {
      return this.$route.meta?.title?.split('|')[0]?.trim() || ''
    },
  },

  async created() {
    try {
      const user = await getCurrentUser()
      this.userEmail = user?.email || '管理员'
      authStore.setLoggedIn(user)
    } catch (err) {
      console.error('[AdminLayout] 获取用户信息失败:', err)
    }
  },

  methods: {
    async handleLogout() {
      try {
        await this.$confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await signOut()
        authStore.setLoggedOut()
        this.$message.success('已退出登录')
        this.$router.push('/admin/login')
      } catch (err) {
        if (err !== 'cancel') {
          console.error('[AdminLayout] 退出登录失败:', err)
        }
      }
    },
  },
}
</script>
