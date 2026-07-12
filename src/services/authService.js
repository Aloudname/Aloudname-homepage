/**
 * 认证服务
 * 封装 Supabase Auth 操作
 */
import supabase from '@/config/supabase'

/**
 * 邮箱密码登录
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object, session: object}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message?.includes('Invalid login')) {
      throw new Error('邮箱或密码错误')
    }
    throw error
  }

  return data
}

/**
 * 登出
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * 获取当前 session（同步检查本地存储，不发起网络请求）
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * 获取当前用户信息
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

/**
 * 修改密码（需要先登录）
 * @param {string} newPassword
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}

/**
 * 初始化鉴权状态监听
 * 应在 main.js 中调用
 */
export function initAuthListener() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('[Auth] 用户已登录:', session?.user?.email)
    } else if (event === 'SIGNED_OUT') {
      console.log('[Auth] 用户已登出')
      // 如果在管理页面，重定向到登录页
      const path = window.location.pathname
      if (path.startsWith('/admin') && !path.includes('/login')) {
        window.location.href = '/admin/login'
      }
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('[Auth] Token 已刷新')
    }
  })
}
