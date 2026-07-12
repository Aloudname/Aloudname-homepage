import Vue from 'vue'
import VueRouter from 'vue-router'
import supabase from '@/config/supabase'
import HomeView from '../views/HomeView/HomeView.vue'

Vue.use(VueRouter)

// ========== 公开页面路由 ==========
const publicRoutes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首页' }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/FirstView/FirstView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('../views/BlogView/BlogView.vue'),
    meta: { title: '博客' }
  },
  {
    path: '/blog/:slug',
    name: 'post',
    component: () => import('../views/public/PostView.vue'),
    meta: { title: '文章' }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/404View.vue'),
    meta: { title: '404 Not Found' }
  },
]

// ========== 管理后台路由 ==========
const adminRoutes = {
  path: '/admin',
  component: () => import('../views/admin/AdminLayout.vue'),
  meta: { requiresAuth: true },
  children: [
    { path: '', redirect: 'dashboard' },
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('../views/admin/DashboardView.vue'),
      meta: { title: '仪表盘 | 管理后台' }
    },
    {
      path: 'editor',
      name: 'PageEditor',
      component: () => import('../views/admin/PageEditorView.vue'),
      meta: { title: '页面编辑器 | 管理后台' }
    },
    {
      path: 'editor/bg',
      name: 'BgEditor',
      component: () => import('../views/admin/BackgroundEditor.vue'),
      meta: { title: '背景编辑 | 管理后台' }
    },
    {
      path: 'editor/cursor',
      name: 'CursorEditor',
      component: () => import('../views/admin/CursorEditor.vue'),
      meta: { title: '光标编辑 | 管理后台' }
    },
    {
      path: 'editor/music',
      name: 'MusicEditor',
      component: () => import('../views/admin/MusicEditor.vue'),
      meta: { title: '音乐编辑 | 管理后台' }
    },
    {
      path: 'editor/banner',
      name: 'BannerEditor',
      component: () => import('../views/admin/BannerEditor.vue'),
      meta: { title: 'Banner | 管理后台' }
    },
    {
      path: 'editor/content',
      name: 'ContentEditorRoute',
      component: () => import('../views/admin/ContentEditor.vue'),
      meta: { title: '首页内容 | 管理后台' }
    },
    {
      path: 'posts',
      name: 'PostsManager',
      component: () => import('../views/admin/PostsManager.vue'),
      meta: { title: '文章管理 | 管理后台' }
    },
    {
      path: 'posts/new',
      name: 'NewPost',
      component: () => import('../views/admin/PostEditView.vue'),
      meta: { title: '新建文章 | 管理后台' }
    },
    {
      path: 'posts/:id/edit',
      name: 'EditPost',
      component: () => import('../views/admin/PostEditView.vue'),
      meta: { title: '编辑文章 | 管理后台' }
    },
    {
      path: 'assets',
      name: 'AssetsManager',
      component: () => import('../views/admin/AssetsManager.vue'),
      meta: { title: '资源管理 | 管理后台' }
    },
    {
      path: 'settings',
      name: 'Settings',
      component: () => import('../views/admin/SettingsView.vue'),
      meta: { title: '全局设置 | 管理后台' }
    },
  ]
}

const loginRoute = {
  path: '/admin/login',
  name: 'Login',
  component: () => import('../views/admin/LoginView.vue'),
  meta: { title: '管理员登录' }
}

const catchAllRoute = {
  path: '*',
  redirect: '/404',
  hidden: true
}

// ========== 构建 Router ==========
const router = new VueRouter({
  mode: 'history',
  routes: [
    ...publicRoutes,
    adminRoutes,
    loginRoute,
    catchAllRoute,
  ]
})

// ========== 全局导航守卫 ==========
router.beforeEach(async (to, from, next) => {
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 检查是否需要鉴权
  if (to.matched.some(record => record.meta.requiresAuth)) {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // 未登录 → 重定向到登录页
        next({
          path: '/admin/login',
          query: { redirect: to.fullPath }
        })
      } else {
        next()
      }
    } catch (err) {
      console.error('[Router Guard] 获取 session 失败:', err)
      next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    next()
  }
})

export default router
