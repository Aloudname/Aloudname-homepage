/**
 * Supabase 客户端初始化（单例）
 * 整个应用共享同一个 Supabase 实例
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] 环境变量未正确配置。\n' +
    '请确保 .env.development 或 .env.production 中设置了:\n' +
    '  VUE_APP_SUPABASE_URL\n' +
    '  VUE_APP_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

export default supabase
