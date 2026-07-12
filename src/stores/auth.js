/**
 * 鉴权状态管理
 */
import Vue from 'vue'
import { getSession, getCurrentUser } from '@/services/authService'

const state = Vue.observable({
  isLoggedIn: false,
  user: null,
  loading: true, // 初始加载中
})

export default {
  get isLoggedIn() { return state.isLoggedIn },
  get user() { return state.user },
  get loading() { return state.loading },

  /**
   * 初始化/刷新鉴权状态
   * 应用启动时调用，恢复已存在的 session
   */
  async refresh() {
    state.loading = true
    try {
      const session = await getSession()
      if (session) {
        const user = await getCurrentUser()
        state.isLoggedIn = true
        state.user = user
      } else {
        state.isLoggedIn = false
        state.user = null
      }
    } catch (err) {
      console.error('[authStore] 刷新鉴权状态失败:', err)
      state.isLoggedIn = false
      state.user = null
    } finally {
      state.loading = false
    }
  },

  /**
   * 设置登录状态
   */
  setLoggedIn(user) {
    state.isLoggedIn = true
    state.user = user
  },

  /**
   * 清除登录状态
   */
  setLoggedOut() {
    state.isLoggedIn = false
    state.user = null
  },
}
