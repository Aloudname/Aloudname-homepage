/**
 * 路由鉴权守卫（用于 AdminLayout 等需要登录的页面）
 *
 * 使用方式:
 *   import authGuard from '@/mixins/authGuard'
 *   export default { mixins: [authGuard], ... }
 */
import { getSession } from '@/services/authService'

export default {
  data() {
    return {
      authChecked: false,
      authAllowed: false,
    }
  },

  async beforeMount() {
    await this.checkAuth()
  },

  methods: {
    async checkAuth() {
      try {
        const session = await getSession()
        if (session) {
          this.authAllowed = true
        } else {
          this.redirectToLogin()
          return
        }
      } catch (err) {
        console.error('[authGuard] 检查登录状态失败:', err)
        this.redirectToLogin()
      } finally {
        this.authChecked = true
      }
    },

    redirectToLogin() {
      const currentPath = this.$route?.fullPath || window.location.pathname
      this.$router?.push({
        path: '/admin/login',
        query: { redirect: currentPath },
      }).catch(() => {
        // 导航重复时忽略
      })
    },
  },
}
